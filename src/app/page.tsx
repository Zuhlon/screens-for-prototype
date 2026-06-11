'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import {
  Bell, X, Plus, User, Check, Pencil, Trash2,
  ChevronLeft, Info, CheckCircle2, CircleDot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'

/* ───────── types ───────── */
interface Scenario {
  id: number
  name: string
  events: string[]
  methods: string[]
  recipients: string[]
}

/* ───────── data ───────── */
const EVENT_OPTIONS = [
  'Пропущенные на номера',
  'Пропущенные отделами',
  'Пропущенные кол-центрами',
]

const METHOD_OPTIONS = [
  'Email-уведомления',
  'Push-уведомления',
  'Telegram-бот',
]

/* ───────── main page ───────── */
export default function Home() {
  /* state */
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const confirmCb = useRef<() => void>(() => {})

  // success overlay
  const [showSuccess, setShowSuccess] = useState(false)

  // settings form
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [selectedMethod, setSelectedMethod] = useState('')
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState('')
  const [recipientError, setRecipientError] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const recipientInputRef = useRef<HTMLInputElement>(null)

  /* helpers */
  const hasUnsavedSettings = selectedEvents.length > 0
    || selectedMethod !== ''
    || recipients.length > 0
    || scenarioName.length > 0

  const resetForm = useCallback(() => {
    setSelectedEvents([])
    setSelectedMethod('')
    setRecipients([])
    setRecipientInput('')
    setRecipientError(false)
    setScenarioName('')
    setEditingId(null)
  }, [])

  /* popup open → then maybe settings */
  const handleOpenPopup = () => setPopupOpen(true)

  const handleClosePopup = () => setPopupOpen(false)

  const handleGoToSettings = () => {
    setPopupOpen(false)
    resetForm()
    setTimeout(() => setSettingsOpen(true), 200)
  }

  /* settings close with unsaved guard */
  const handleCloseSettings = () => {
    if (hasUnsavedSettings) {
      showConfirm('Закрыть без сохранения?', 'Вы заполнили часть данных. Закрыть без сохранения?', () => {
        setSettingsOpen(false)
        resetForm()
      })
    } else {
      setSettingsOpen(false)
      resetForm()
    }
  }

  /* recipients */
  const addRecipient = () => {
    const val = recipientInput.trim()
    if (val.length < 2) {
      setRecipientError(true)
      recipientInputRef.current?.focus()
      return
    }
    if (recipients.includes(val)) {
      toast.warning('Этот получатель уже добавлен')
      setRecipientInput('')
      return
    }
    if (recipients.length >= 5) {
      toast.warning('Максимум 5 получателей на сценарий')
      return
    }
    setRecipientError(false)
    setRecipients(prev => [...prev, val])
    setRecipientInput('')
    recipientInputRef.current?.focus()
  }

  const removeRecipient = (idx: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== idx))
  }

  /* save scenario */
  const handleSaveScenario = () => {
    if (selectedEvents.length === 0) {
      toast.error('Выберите хотя бы одно событие для отслеживания')
      return
    }
    if (!selectedMethod) {
      toast.error('Выберите способ оповещения')
      return
    }
    if (recipients.length === 0) {
      toast.error('Добавьте хотя бы одного получателя уведомлений')
      return
    }

    const newScenario: Scenario = {
      id: editingId ?? Date.now(),
      name: scenarioName.trim() || `Сценарий ${scenarios.length + 1}`,
      events: [...selectedEvents],
      methods: [selectedMethod],
      recipients: [...recipients],
    }

    setScenarios(prev =>
      editingId
        ? prev.map(s => (s.id === editingId ? newScenario : s))
        : [...prev, newScenario]
    )

    setSettingsOpen(false)
    resetForm()
    toast.success('Сценарий успешно добавлен')
  }

  /* edit / delete */
  const handleEdit = (s: Scenario) => {
    setEditingId(s.id)
    setScenarioName(s.name)
    setSelectedEvents([...s.events])
    setSelectedMethod(s.methods[0] || '')
    setRecipients([...s.recipients])
    setSettingsOpen(true)
  }

  const handleDelete = (s: Scenario) => {
    showConfirm('Удалить сценарий?', `"${s.name}" будет удалён безвозвратно`, () => {
      setScenarios(prev => prev.filter(sc => sc.id !== s.id))
      toast.info('Сценарий удалён')
    })
  }

  /* main save */
  const handleSaveAll = () => {
    if (scenarios.length === 0) {
      toast.error('Сначала добавьте хотя бы один сценарий')
      return
    }
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2500)
  }

  /* confirm helper */
  const showConfirm = (title: string, text: string, cb: () => void) => {
    setConfirmTitle(title)
    setConfirmText(text)
    confirmCb.current = cb
    setConfirmOpen(true)
  }

  const handleCancel = () => {
    if (scenarios.length > 0) {
      showConfirm('Отменить изменения?', 'Все добавленные сценарии будут удалены', () => {
        setScenarios([])
        toast.info('Изменения отменены')
      })
    } else {
      toast.info('Нет изменений для отмены')
    }
  }

  const handleCloseHeader = () => {
    showConfirm('Закрыть настройки?', 'Вы уверены, что хотите выйти? Несохранённые данные будут потеряны.', () => {
      setScenarios([])
      toast.info('Настройки закрыты')
    })
  }

  /* ─── RENDER ─── */
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center min-h-screen bg-[#f0f0f3] p-4">
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '13px' },
          }}
        />

        {/* Phone frame */}
        <div className="relative w-[390px] h-[844px] bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_0_2px_#d0d0d0] flex flex-col overflow-hidden">

          {/* ── HEADER ── */}
          <header className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8ed] shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-[#3b82f6]" />
              <span className="text-[13px] text-[#8e8e93] font-medium leading-none">
                Настройка уведомлений о пропущенных
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[13px] text-[#636366] rounded-lg"
              onClick={handleCloseHeader}
            >
              <X className="size-3.5" />
              Закрыть
            </Button>
          </header>

          {/* ── CONTENT ── */}
          <main className="flex-1 overflow-y-auto px-5 py-5 flex flex-col">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-[20px] font-bold text-[#1a1a1a] leading-tight">
                  Настройка сценария уведомлений
                </h1>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[13px] text-[#3b82f6] cursor-pointer whitespace-nowrap pt-0.5 hover:underline shrink-0">
                      Как настроить
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-[300px] bg-[#1a1a1a] text-white border-0 rounded-xl p-4"
                  >
                    <p className="font-semibold text-[13px] mb-1.5">Как настроить уведомления</p>
                    <p className="text-white/80 text-[12px] leading-relaxed">
                      1. Нажмите «Добавить сценарий»<br />
                      2. В появившемся окне выберите «Перейти к настройкам»<br />
                      3. Отметьте события для отслеживания<br />
                      4. Выберите способ оповещения<br />
                      5. Добавьте получателей уведомлений<br />
                      6. Нажмите «Добавить» для сохранения сценария
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[13px] text-[#8e8e93] mt-1.5 leading-relaxed">
                Выберите, какие звонки считать пропущенными, и настройте способ оповещения
              </p>
            </div>

            {/* Empty state */}
            {scenarios.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-5">
                <div className="w-[72px] h-[72px] rounded-full bg-[#e8f0fe] flex items-center justify-center mb-5">
                  <User className="size-8 text-[#3b82f6]" />
                </div>
                <p className="text-[16px] font-semibold text-[#1a1a1a] mb-2 max-w-[280px]">
                  У вас нет сценариев для получения уведомлений о пропущенных
                </p>
                <p className="text-[13px] text-[#8e8e93] mb-6">
                  Попробуйте задать запрос по-другому
                </p>
                <Button
                  variant="outline"
                  className="gap-2 text-[14px] text-[#636366] rounded-xl px-6 py-3 hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#f8faff]"
                  onClick={handleOpenPopup}
                >
                  <Plus className="size-[18px]" />
                  Добавить сценарий
                </Button>
              </div>
            )}

            {/* Scenario list */}
            {scenarios.length > 0 && (
              <div className="flex flex-col gap-3">
                {scenarios.map(s => (
                  <div
                    key={s.id}
                    className="border border-[#e8e8ed] rounded-xl p-4 transition-all hover:border-[#d1d1d6] hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-semibold text-[#1a1a1a]">{s.name}</span>
                      <Badge className="bg-[#e8f8ef] text-[#34c759] text-[11px] font-semibold hover:bg-[#e8f8ef] border-0 rounded-full px-2.5 py-0.5">
                        Активен
                      </Badge>
                    </div>
                    <p className="text-[12px] text-[#8e8e93] leading-relaxed">
                      <span className="font-medium text-[#636366]">События:</span> {s.events.join(', ')}<br />
                      <span className="font-medium text-[#636366]">Оповещение:</span> {s.methods.join(', ')}
                    </p>
                    <div className="mt-2.5 pt-2.5 border-t border-[#f2f2f7] text-[12px] text-[#636366] flex items-center gap-1.5">
                      <User className="size-3.5 text-[#8e8e93]" />
                      {s.recipients.join(', ')}
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-[#f2f2f7] flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[12px] gap-1 bg-[#f0f6ff] border-[#bfdbfe] text-[#1e40af] hover:bg-[#dbeafe] rounded-lg h-8"
                        onClick={() => handleEdit(s)}
                      >
                        <Pencil className="size-3.5" />
                        Изменить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[12px] gap-1 bg-[#fff5f5] border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2] rounded-lg h-8"
                        onClick={() => handleDelete(s)}
                      >
                        <Trash2 className="size-3.5" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="gap-2 border-dashed text-[13px] text-[#8e8e93] rounded-xl py-3 hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#f8faff] mt-1"
                  onClick={handleOpenPopup}
                >
                  <Plus className="size-4" />
                  Добавить ещё один сценарий
                </Button>
              </div>
            )}
          </main>

          {/* ── FOOTER ── */}
          <footer className="flex justify-end gap-2.5 px-5 py-4 border-t border-[#e8e8ed] shrink-0 bg-white">
            <Button
              variant="outline"
              className="text-[14px] text-[#636366] rounded-xl px-5 h-10"
              onClick={handleCancel}
            >
              Отменить
            </Button>
            <Button
              className="text-[14px] font-semibold rounded-xl px-6 h-10 bg-[#f5c518] text-[#1a1a1a] hover:bg-[#e5b800] border-0 shadow-none"
              onClick={handleSaveAll}
            >
              Сохранить
            </Button>
          </footer>

          {/* ── POPUP ── */}
          <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
            <DialogContent className="sm:max-w-[340px] rounded-2xl p-7 gap-0">
              <DialogHeader className="text-center">
                <DialogTitle className="text-[16px] font-bold text-center">
                  Уведомления о пропущенных подключены
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Информация о подключённых уведомлениях
                </DialogDescription>
              </DialogHeader>

              <p className="text-[13px] font-semibold text-[#1a1a1a] mb-2">
                Теперь вы можете:
              </p>
              <ul className="space-y-1.5 mb-4">
                {EVENT_OPTIONS.map(ev => (
                  <li key={ev} className="flex items-start gap-2 text-[13px] text-[#3a3a3c]">
                    <CircleDot className="size-1.5 mt-[7px] shrink-0 text-[#3b82f6] fill-[#3b82f6]" />
                    {ev}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-[#8e8e93] leading-relaxed mb-6">
                Для начала работы выберите события для отслеживания и добавьте получателей уведомлений
              </p>
              <DialogFooter className="flex-row gap-2.5 sm:justify-between">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="flex-1 text-[13px] rounded-xl h-10"
                  >
                    Закрыть
                  </Button>
                </DialogClose>
                <Button
                  className="flex-1 text-[13px] font-semibold rounded-xl h-10 bg-[#f5c518] text-[#1a1a1a] hover:bg-[#e5b800] border-0 shadow-none"
                  onClick={handleGoToSettings}
                >
                  Перейти к настройкам
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── SETTINGS SHEET ── */}
          <Sheet open={settingsOpen} onOpenChange={(open) => {
            if (!open) handleCloseSettings()
            else setSettingsOpen(true)
          }}>
            <SheetContent side="right" className="w-full sm:max-w-[390px] p-0 rounded-l-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e8e8ed]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg bg-[#f2f2f7] hover:bg-[#e5e5ea]"
                  onClick={handleCloseSettings}
                >
                  <ChevronLeft className="size-[18px]" />
                </Button>
                <SheetTitle className="text-[16px] font-bold">Настройка сценария</SheetTitle>
              </div>
              <SheetDescription className="sr-only">Настройка событий и получателей уведомлений</SheetDescription>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Events */}
                <section>
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">
                    События для отслеживания
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {EVENT_OPTIONS.map(ev => (
                      <label
                        key={ev}
                        className={`flex items-center gap-3 px-3.5 py-3 border rounded-xl cursor-pointer transition-all select-none ${
                          selectedEvents.includes(ev)
                            ? 'border-[#3b82f6] bg-[#f0f6ff]'
                            : 'border-[#e8e8ed] hover:border-[#d1d1d6] hover:bg-[#fafafa]'
                        }`}
                      >
                        <Checkbox
                          checked={selectedEvents.includes(ev)}
                          onCheckedChange={() => {
                            setSelectedEvents(prev =>
                              prev.includes(ev)
                                ? prev.filter(e => e !== ev)
                                : [...prev, ev]
                            )
                          }}
                          className="size-[22px] rounded-md"
                        />
                        <span className="text-[13px] text-[#3a3a3c]">{ev}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Methods (radio-like) */}
                <section>
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">
                    Способ оповещения
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {METHOD_OPTIONS.map(m => (
                      <label
                        key={m}
                        className={`flex items-center gap-3 px-3.5 py-3 border rounded-xl cursor-pointer transition-all select-none ${
                          selectedMethod === m
                            ? 'border-[#3b82f6] bg-[#f0f6ff]'
                            : 'border-[#e8e8ed] hover:border-[#d1d1d6] hover:bg-[#fafafa]'
                        }`}
                      >
                        <Checkbox
                          checked={selectedMethod === m}
                          onCheckedChange={() => setSelectedMethod(m)}
                          className="size-[22px] rounded-md"
                        />
                        <span className="text-[13px] text-[#3a3a3c]">{m}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Recipients */}
                <section>
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">
                    Получатели уведомлений
                  </h3>
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
                      {recipients.map((r, i) => (
                        <motion.span
                          key={`${r}-${i}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f0f6ff] border border-[#bfdbfe] rounded-full text-[12px] text-[#1e40af]"
                        >
                          {r}
                          <button
                            onClick={() => removeRecipient(i)}
                            className="hover:bg-[#1e40af]/10 rounded-full p-0.5 transition-colors"
                          >
                            <X className="size-3 text-[#3b82f6]" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="text-[13px] font-medium text-[#636366] mb-1.5 block">
                      Добавить получателя
                    </label>
                    <Input
                      ref={recipientInputRef}
                      type="text"
                      placeholder="Email или имя получателя"
                      value={recipientInput}
                      onChange={(e) => {
                        setRecipientInput(e.target.value)
                        setRecipientError(false)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') addRecipient() }}
                      className={`rounded-xl h-10 text-[14px] ${
                        recipientError
                          ? 'border-[#ff3b30] focus-visible:ring-[#ff3b30]/30'
                          : ''
                      }`}
                    />
                    <p className="text-[11px] text-[#8e8e93] mt-1">
                      Нажмите Enter для добавления
                    </p>
                    {recipientError && (
                      <p className="text-[11px] text-[#ff3b30] mt-1">
                        Введите корректный email или имя (минимум 2 символа)
                      </p>
                    )}
                  </div>
                </section>

                {/* Scenario name */}
                <section>
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">
                    Название сценария
                  </h3>
                  <Input
                    type="text"
                    placeholder="Например: Пропущенные от клиентов"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="rounded-xl h-10 text-[14px]"
                  />
                  <p className="text-[11px] text-[#8e8e93] mt-1">Необязательное поле для удобства</p>
                </section>
              </div>

              {/* Footer */}
              <SheetFooter className="flex-row justify-end gap-2.5 px-5 py-4 border-t border-[#e8e8ed]">
                <Button
                  variant="outline"
                  className="text-[14px] text-[#636366] rounded-xl px-5 h-10"
                  onClick={handleCloseSettings}
                >
                  Отменить
                </Button>
                <Button
                  className="text-[14px] font-semibold rounded-xl px-6 h-10 bg-[#f5c518] text-[#1a1a1a] hover:bg-[#e5b800] border-0 shadow-none"
                  onClick={handleSaveScenario}
                >
                  {editingId ? 'Сохранить' : 'Добавить'}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* ── CONFIRM DIALOG ── */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="sm:max-w-[300px] rounded-2xl p-7 text-center">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center">{confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription className="text-center">{confirmText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2.5 sm:justify-center">
                <AlertDialogCancel className="flex-1 text-[13px] rounded-xl h-10">
                  Нет, остаться
                </AlertDialogCancel>
                <AlertDialogAction
                  className="flex-1 text-[13px] font-semibold rounded-xl h-10 bg-[#f5c518] text-[#1a1a1a] hover:bg-[#e5b800] border-0"
                  onClick={() => {
                    confirmCb.current()
                    setConfirmOpen(false)
                  }}
                >
                  Да
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ── SUCCESS OVERLAY ── */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-50 bg-white/97 flex flex-col items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="w-20 h-20 rounded-full bg-[#e8f8ef] flex items-center justify-center mb-5"
                >
                  <CheckCircle2 className="size-10 text-[#34c759]" />
                </motion.div>
                <h2 className="text-[18px] font-bold text-[#1a1a1a] mb-2">
                  Настройки сохранены
                </h2>
                <p className="text-[13px] text-[#8e8e93] text-center max-w-[260px] leading-relaxed">
                  Сценарии уведомлений о пропущенных успешно настроены
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </TooltipProvider>
  )
}
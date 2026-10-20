'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Droplet, FlaskConical, CircleDot, Plus } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@core/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@core/components/ui/select'
import { Field, FieldLabel } from '@core/components/ui/field'
import { Input } from '@core/components/ui/input'
import { Textarea } from '@core/components/ui/textarea'
import { useAuth } from '@core/context/auth-context'
import {
  getCycles, createCycle, deleteCycle,
  getScreenings, createScreening,
  getDevices, createDevice, updateDevice,
} from '@/lib/api/health-tracking'
import type {
  MenstrualCycle, CycleFlow, GynecologyScreening, ScreeningType, ContraceptiveDevice, ContraceptiveStatus,
} from '@/types/specialty'
import { fmtDate } from '@core/lib/utils'

const today = () => new Date().toISOString().slice(0, 10)

// ── Menstrual cycle history ──────────────────────────────────────────────────

const EMPTY_CYCLE = { cycleStartDate: today(), cycleLengthDays: '', flow: '__none__' as CycleFlow | '__none__', symptoms: '', notes: '' }

function CycleHistorySection({ patientId }: { patientId: string }) {
  const t = useTranslations('health-tracking-panel')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'mjek'
  const [cycles, setCycles] = useState<MenstrualCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_CYCLE)
  const [saving, setSaving] = useState(false)

  const load = () => getCycles({ patientId }).then(setCycles).catch(() => toast.error(t('loadError'))).finally(() => setLoading(false))
  useEffect(() => { load() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!form.cycleStartDate) return
    setSaving(true)
    try {
      const created = await createCycle({
        patientId,
        doctorId: user?.role === 'mjek' ? user.id : undefined,
        cycleStartDate: form.cycleStartDate,
        cycleLengthDays: form.cycleLengthDays ? Number(form.cycleLengthDays) : undefined,
        flow: form.flow !== '__none__' ? form.flow : undefined,
        symptoms: form.symptoms.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      setCycles(prev => [created, ...prev])
      toast.success(t('createSuccess'))
      setOpen(false)
      setForm(EMPTY_CYCLE)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCycle(id)
      setCycles(prev => prev.filter(c => c.id !== id))
      toast.success(t('deleteSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteError'))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{t('cycleHeading')}</p>
        {canEdit && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t('addCycle')}
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('loading')}</p>
      ) : cycles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('noCycles')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {cycles.map(c => (
            <span key={c.id} className="chip-neutral rounded-full pl-2.5 pr-1.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
              <Droplet className="h-3 w-3" />
              {fmtDate(c.cycleStartDate)}
              {c.cycleLengthDays ? ` · ${t('daysShort', { days: c.cycleLengthDays })}` : ''}
              {canEdit && (
                <button onClick={() => handleDelete(c.id)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
              )}
            </span>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('cycleDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t('cycleDialog.startDateLabel')}</FieldLabel>
                <Input type="date" value={form.cycleStartDate} onChange={e => setForm(f => ({ ...f, cycleStartDate: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('cycleDialog.lengthLabel')}</FieldLabel>
                <Input type="number" min={1} max={60} value={form.cycleLengthDays} onChange={e => setForm(f => ({ ...f, cycleLengthDays: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>{t('cycleDialog.flowLabel')}</FieldLabel>
              <Select value={form.flow} onValueChange={v => setForm(f => ({ ...f, flow: v as CycleFlow | '__none__' }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('cycleDialog.flowNone')}</SelectItem>
                  <SelectItem value="e_lehte">{t('flow.e_lehte')}</SelectItem>
                  <SelectItem value="normale">{t('flow.normale')}</SelectItem>
                  <SelectItem value="e_rende">{t('flow.e_rende')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t('cycleDialog.symptomsLabel')}</FieldLabel>
              <Textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} className="resize-none h-14" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!form.cycleStartDate || saving}>{saving ? t('saving') : t('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Screenings (Pap / STI / hormonal) ────────────────────────────────────────

const EMPTY_SCREENING = { screeningType: 'pap' as ScreeningType, testDate: today(), resultSummary: '', isNormal: true, nextDueDate: '', notes: '' }

function ScreeningsSection({ patientId }: { patientId: string }) {
  const t = useTranslations('health-tracking-panel')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'mjek'
  const [screenings, setScreenings] = useState<GynecologyScreening[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_SCREENING)
  const [saving, setSaving] = useState(false)

  const load = () => getScreenings({ patientId }).then(setScreenings).catch(() => toast.error(t('loadError'))).finally(() => setLoading(false))
  useEffect(() => { load() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setForm({ ...EMPTY_SCREENING, testDate: today() }); setOpen(true) }

  const handleCreate = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'mjek')) return
    setSaving(true)
    try {
      const created = await createScreening({
        patientId,
        doctorId: user.id,
        screeningType: form.screeningType,
        testDate: form.testDate,
        resultSummary: form.resultSummary.trim() || undefined,
        isNormal: form.isNormal,
        nextDueDate: form.nextDueDate || undefined,
        notes: form.notes.trim() || undefined,
      })
      setScreenings(prev => [created, ...prev])
      toast.success(t('createSuccess'))
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{t('screeningsHeading')}</p>
        {canEdit && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t('addScreening')}
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('loading')}</p>
      ) : screenings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('noScreenings')}</p>
      ) : (
        <div className="space-y-1.5">
          {screenings.map(s => (
            <div key={s.id} className="rounded-lg border border-border/50 p-2.5 text-xs flex items-start gap-2.5">
              <FlaskConical className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{t(`screeningType.${s.screeningType}`)}</span>
                  <span className={`${s.isNormal ? 'chip-green' : 'chip-red'} rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase`}>
                    {s.isNormal ? t('normal') : t('abnormal')}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {fmtDate(s.testDate)}{s.resultSummary ? ` — ${s.resultSummary}` : ''}
                  {s.nextDueDate ? ` · ${t('nextDueLine', { date: fmtDate(s.nextDueDate) })}` : ''}
                </p>
                {s.notes && <p className="text-muted-foreground mt-1">{s.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('screeningDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>{t('screeningDialog.typeLabel')}</FieldLabel>
              <Select value={form.screeningType} onValueChange={v => setForm(f => ({ ...f, screeningType: v as ScreeningType }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pap">{t('screeningType.pap')}</SelectItem>
                  <SelectItem value="sti">{t('screeningType.sti')}</SelectItem>
                  <SelectItem value="hormonal">{t('screeningType.hormonal')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t('screeningDialog.dateLabel')}</FieldLabel>
                <Input type="date" value={form.testDate} onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('screeningDialog.resultLabel')}</FieldLabel>
                <Select value={form.isNormal ? 'true' : 'false'} onValueChange={v => setForm(f => ({ ...f, isNormal: v === 'true' }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('normal')}</SelectItem>
                    <SelectItem value="false">{t('abnormal')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel>{t('screeningDialog.summaryLabel')}</FieldLabel>
              <Input value={form.resultSummary} onChange={e => setForm(f => ({ ...f, resultSummary: e.target.value }))} placeholder={t('screeningDialog.summaryPlaceholder')} />
            </Field>
            {form.screeningType === 'pap' && (
              <Field>
                <FieldLabel>{t('screeningDialog.nextDueLabel')}</FieldLabel>
                <Input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))} />
              </Field>
            )}
            <Field>
              <FieldLabel>{t('screeningDialog.notesLabel')}</FieldLabel>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-14" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? t('saving') : t('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Contraceptive / IUD devices ──────────────────────────────────────────────

const EMPTY_DEVICE = { deviceType: '', insertionDate: today(), plannedRemovalDate: '', notes: '' }
const DEVICE_STATUS_CHIP: Record<ContraceptiveStatus, string> = { aktiv: 'chip-green', hequr: 'chip-neutral', skaduar: 'chip-amber' }

function ContraceptiveSection({ patientId }: { patientId: string }) {
  const t = useTranslations('health-tracking-panel')
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'mjek'
  const [devices, setDevices] = useState<ContraceptiveDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_DEVICE)
  const [saving, setSaving] = useState(false)

  const load = () => getDevices({ patientId }).then(setDevices).catch(() => toast.error(t('loadError'))).finally(() => setLoading(false))
  useEffect(() => { load() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'mjek') || !form.deviceType.trim()) return
    setSaving(true)
    try {
      const created = await createDevice({
        patientId, doctorId: user.id, deviceType: form.deviceType.trim(),
        insertionDate: form.insertionDate, plannedRemovalDate: form.plannedRemovalDate || undefined,
        notes: form.notes.trim() || undefined,
      })
      setDevices(prev => [created, ...prev])
      toast.success(t('createSuccess'))
      setOpen(false)
      setForm(EMPTY_DEVICE)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (device: ContraceptiveDevice, status: ContraceptiveStatus) => {
    try {
      const updated = await updateDevice(device.id, { status })
      setDevices(prev => prev.map(d => d.id === updated.id ? updated : d))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('updateError'))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{t('devicesHeading')}</p>
        {canEdit && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t('addDevice')}
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('loading')}</p>
      ) : devices.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">{t('noDevices')}</p>
      ) : (
        <div className="space-y-1.5">
          {devices.map(d => (
            <div key={d.id} className="rounded-lg border border-border/50 p-2.5 text-xs flex items-start gap-2.5">
              <CircleDot className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{d.deviceType}</span>
                  {canEdit && d.status === 'aktiv' ? (
                    <Select value={d.status} onValueChange={(v) => handleStatusChange(d, v as ContraceptiveStatus)}>
                      <SelectTrigger className="rounded-lg h-6 text-[10px] w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktiv">{t('deviceStatus.aktiv')}</SelectItem>
                        <SelectItem value="hequr">{t('deviceStatus.hequr')}</SelectItem>
                        <SelectItem value="skaduar">{t('deviceStatus.skaduar')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`${DEVICE_STATUS_CHIP[d.status]} rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase`}>
                      {t(`deviceStatus.${d.status}`)}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {t('insertedLine', { date: fmtDate(d.insertionDate) })}
                  {d.actualRemovalDate ? ` · ${t('removedLine', { date: fmtDate(d.actualRemovalDate) })}` : d.plannedRemovalDate ? ` · ${t('plannedRemovalLine', { date: fmtDate(d.plannedRemovalDate) })}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('deviceDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>{t('deviceDialog.typeLabel')}</FieldLabel>
              <Input value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))} placeholder={t('deviceDialog.typePlaceholder')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t('deviceDialog.insertionDateLabel')}</FieldLabel>
                <Input type="date" value={form.insertionDate} onChange={e => setForm(f => ({ ...f, insertionDate: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('deviceDialog.plannedRemovalLabel')}</FieldLabel>
                <Input type="date" value={form.plannedRemovalDate} onChange={e => setForm(f => ({ ...f, plannedRemovalDate: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>{t('deviceDialog.notesLabel')}</FieldLabel>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-14" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!form.deviceType.trim() || saving}>{saving ? t('saving') : t('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Combined panel ───────────────────────────────────────────────────────────

export function HealthTrackingPanel({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <CycleHistorySection patientId={patientId} />
      <div className="border-t border-border/50 pt-4">
        <ScreeningsSection patientId={patientId} />
      </div>
      <div className="border-t border-border/50 pt-4">
        <ContraceptiveSection patientId={patientId} />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Baby, Plus, AlertTriangle, Stethoscope } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@core/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@core/components/ui/select'
import { Field, FieldLabel } from '@core/components/ui/field'
import { Input } from '@core/components/ui/input'
import { Textarea } from '@core/components/ui/textarea'
import { useAuth } from '@core/context/auth-context'
import { useData } from '@core/context/data-context'
import { getPregnancies, createPregnancy, updatePregnancy, addPrenatalVisit } from '@/lib/api/pregnancy'
import type { Pregnancy, PregnancyStatus } from '@/types/specialty'
import { fmtDate } from '@core/lib/utils'

const STATUS_CHIP: Record<PregnancyStatus, string> = {
  aktive: 'chip-green', perfunduar: 'chip-neutral', nderprere: 'chip-red',
}

const today = () => new Date().toISOString().slice(0, 10)

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Whole weeks elapsed since LMP, as of today — a quick at-a-glance figure;
// each visit still records its own gestationalWeek explicitly (see
// pregnancy.controller.js) rather than relying on this live computation,
// since that's a point-in-time fact that must not silently drift if the
// EDD is corrected later.
function currentGestationalWeek(lmpDate: string) {
  const days = Math.floor((Date.now() - new Date(lmpDate).getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.floor(days / 7))
}

const EMPTY_PREGNANCY = { doctorId: '', lmpDate: today(), notes: '' }
const EMPTY_VISIT = {
  doctorId: '', visitDate: today(), gestationalWeek: '', fundalHeightCm: '',
  bpSystolic: '', bpDiastolic: '', weightKg: '', fetalHeartbeatBpm: '', notes: '',
}

export function PregnancyPanel({ patientId }: { patientId: string }) {
  const t = useTranslations('pregnancy-panel')
  const { user } = useAuth()
  const { staff } = useData()
  const doctors = staff.filter(s => s.role === 'mjek' && s.status === 'aktiv')
  const canEdit = user?.role === 'admin' || user?.role === 'mjek'

  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [newForm, setNewForm] = useState(EMPTY_PREGNANCY)
  const [saving, setSaving] = useState(false)

  const [visitDialogFor, setVisitDialogFor] = useState<string | null>(null)
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT)

  const load = async () => {
    try {
      setPregnancies(await getPregnancies({ patientId }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setNewForm({ ...EMPTY_PREGNANCY, doctorId: user?.role === 'mjek' ? user.id : '' })
    setNewOpen(true)
  }

  const handleCreate = async () => {
    if (!newForm.doctorId || !newForm.lmpDate) return
    setSaving(true)
    try {
      const created = await createPregnancy({
        patientId, doctorId: newForm.doctorId, lmpDate: newForm.lmpDate,
        notes: newForm.notes.trim() || undefined,
      })
      setPregnancies(prev => [created, ...prev])
      toast.success(t('createSuccess'))
      setNewOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (pregnancy: Pregnancy, status: PregnancyStatus) => {
    try {
      const updated = await updatePregnancy(pregnancy.id, { status })
      setPregnancies(prev => prev.map(p => p.id === updated.id ? updated : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('updateError'))
    }
  }

  const openVisitDialog = (pregnancyId: string) => {
    setVisitForm({ ...EMPTY_VISIT, doctorId: user?.role === 'mjek' ? user.id : '' })
    setVisitDialogFor(pregnancyId)
  }

  const handleAddVisit = async () => {
    if (!visitDialogFor || !visitForm.doctorId || !visitForm.visitDate) return
    setSaving(true)
    try {
      const updated = await addPrenatalVisit(visitDialogFor, {
        doctorId: visitForm.doctorId,
        visitDate: visitForm.visitDate,
        gestationalWeek: visitForm.gestationalWeek ? Number(visitForm.gestationalWeek) : undefined,
        fundalHeightCm: visitForm.fundalHeightCm ? Number(visitForm.fundalHeightCm) : undefined,
        bpSystolic: visitForm.bpSystolic ? Number(visitForm.bpSystolic) : undefined,
        bpDiastolic: visitForm.bpDiastolic ? Number(visitForm.bpDiastolic) : undefined,
        weightKg: visitForm.weightKg ? Number(visitForm.weightKg) : undefined,
        fetalHeartbeatBpm: visitForm.fetalHeartbeatBpm ? Number(visitForm.fetalHeartbeatBpm) : undefined,
        notes: visitForm.notes.trim() || undefined,
      })
      setPregnancies(prev => prev.map(p => p.id === updated.id ? updated : p))
      toast.success(t('visitAddSuccess'))
      setVisitDialogFor(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('visitAddError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{t('loading')}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{t('heading')}</p>
        {canEdit && (
          <Button size="sm" className="rounded-xl h-8 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('startPregnancy')}
          </Button>
        )}
      </div>

      {pregnancies.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('noPregnancies')}</p>
      ) : (
        <div className="space-y-4">
          {pregnancies.map(preg => (
            <div key={preg.id} className="rounded-xl border border-border p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Baby className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('lmpLine', { date: fmtDate(preg.lmpDate) })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('eddLine', { date: fmtDate(preg.eddDate) })}
                      {preg.status === 'aktive' ? ` · ${t('weekLine', { week: currentGestationalWeek(preg.lmpDate) })}` : ''}
                    </p>
                  </div>
                </div>
                {canEdit && preg.status === 'aktive' ? (
                  <Select value={preg.status} onValueChange={(v) => handleStatusChange(preg, v as PregnancyStatus)}>
                    <SelectTrigger className="rounded-lg h-7 text-[11px] w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktive">{t('status.aktive')}</SelectItem>
                      <SelectItem value="perfunduar">{t('status.perfunduar')}</SelectItem>
                      <SelectItem value="nderprere">{t('status.nderprere')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`${STATUS_CHIP[preg.status]} rounded-full px-2 py-0.5 text-[10px] font-medium uppercase shrink-0`}>
                    {t(`status.${preg.status}`)}
                  </span>
                )}
              </div>

              <div className="pl-12 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{t('visits')}</p>
                  {canEdit && preg.status === 'aktive' && (
                    <button
                      className="text-[11px] text-accent font-medium hover:underline"
                      onClick={() => openVisitDialog(preg.id)}
                    >
                      <Stethoscope className="inline h-3 w-3 mr-0.5" />{t('addVisit')}
                    </button>
                  )}
                </div>
                {preg.visits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('noVisits')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {preg.visits.map(v => (
                      <div key={v.id} className="rounded-lg border border-border/50 p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {fmtDate(v.visitDate)}{v.gestationalWeek !== undefined ? ` · ${t('weekShort', { week: v.gestationalWeek })}` : ''}
                          </span>
                          {v.bpFlag && (
                            <span className="chip-red rounded-full px-1.5 py-0.5 text-[9px] font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />{t('bpFlag')}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-muted-foreground">
                          {v.fundalHeightCm !== undefined && <span>{t('fundalHeightShort', { value: v.fundalHeightCm })}</span>}
                          {(v.bpSystolic !== undefined || v.bpDiastolic !== undefined) && <span>{t('bpShort', { sys: v.bpSystolic ?? '—', dia: v.bpDiastolic ?? '—' })}</span>}
                          {v.weightKg !== undefined && <span>{t('weightShort', { value: v.weightKg })}</span>}
                          {v.fetalHeartbeatBpm !== undefined && <span>{t('fhrShort', { value: v.fetalHeartbeatBpm })}</span>}
                        </div>
                        {v.notes && <p className="text-muted-foreground mt-1">{v.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start pregnancy */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('newDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field>
              <FieldLabel>{t('newDialog.doctorLabel')}</FieldLabel>
              <Select value={newForm.doctorId} onValueChange={v => setNewForm(f => ({ ...f, doctorId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('newDialog.doctorPlaceholder')} /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{t('newDialog.lmpLabel')}</FieldLabel>
              <Input type="date" value={newForm.lmpDate} onChange={e => setNewForm(f => ({ ...f, lmpDate: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">{t('newDialog.eddPreview', { date: fmtDate(addDays(newForm.lmpDate, 280)) })}</p>
            </Field>
            <Field>
              <FieldLabel>{t('newDialog.notesLabel')}</FieldLabel>
              <Textarea value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-16" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newForm.doctorId || !newForm.lmpDate || saving}>
              {saving ? t('saving') : t('newDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add prenatal visit */}
      <Dialog open={!!visitDialogFor} onOpenChange={(o) => !o && setVisitDialogFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('visitDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t('visitDialog.dateLabel')}</FieldLabel>
                <Input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(f => ({ ...f, visitDate: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('visitDialog.weekLabel')}</FieldLabel>
                <Input type="number" min={0} max={45} value={visitForm.gestationalWeek} onChange={e => setVisitForm(f => ({ ...f, gestationalWeek: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>{t('visitDialog.doctorLabel')}</FieldLabel>
              <Select value={visitForm.doctorId} onValueChange={v => setVisitForm(f => ({ ...f, doctorId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder={t('newDialog.doctorPlaceholder')} /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>{t('visitDialog.fundalHeightLabel')}</FieldLabel>
                <Input type="number" step="0.1" min={0} value={visitForm.fundalHeightCm} onChange={e => setVisitForm(f => ({ ...f, fundalHeightCm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('visitDialog.weightLabel')}</FieldLabel>
                <Input type="number" step="0.1" min={0} value={visitForm.weightKg} onChange={e => setVisitForm(f => ({ ...f, weightKg: e.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel>{t('visitDialog.bpSystolicLabel')}</FieldLabel>
                <Input type="number" min={0} value={visitForm.bpSystolic} onChange={e => setVisitForm(f => ({ ...f, bpSystolic: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('visitDialog.bpDiastolicLabel')}</FieldLabel>
                <Input type="number" min={0} value={visitForm.bpDiastolic} onChange={e => setVisitForm(f => ({ ...f, bpDiastolic: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>{t('visitDialog.fhrLabel')}</FieldLabel>
                <Input type="number" min={0} value={visitForm.fetalHeartbeatBpm} onChange={e => setVisitForm(f => ({ ...f, fetalHeartbeatBpm: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>{t('visitDialog.notesLabel')}</FieldLabel>
              <Textarea value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} className="resize-none h-16" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogFor(null)}>{t('cancel')}</Button>
            <Button onClick={handleAddVisit} disabled={!visitForm.doctorId || !visitForm.visitDate || saving}>
              {saving ? t('saving') : t('visitDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

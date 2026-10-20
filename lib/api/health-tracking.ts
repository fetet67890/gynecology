import api from '@core/lib/api-client'
import type {
  MenstrualCycle, CycleFlow,
  GynecologyScreening, ScreeningType,
  ContraceptiveDevice, ContraceptiveStatus,
} from '@/types/specialty'

// ── Menstrual cycles ────────────────────────────────────────────────────────
export function getCycles(params?: { patientId?: string }): Promise<MenstrualCycle[]> {
  const q = new URLSearchParams(params as Record<string, string> || {}).toString()
  return api.get<MenstrualCycle[]>(`/api/gynecology-health/cycles${q ? '?' + q : ''}`)
}
export function createCycle(data: {
  patientId: string; doctorId?: string; cycleStartDate: string
  cycleLengthDays?: number; flow?: CycleFlow; symptoms?: string; notes?: string
}): Promise<MenstrualCycle> {
  return api.post<MenstrualCycle>('/api/gynecology-health/cycles', data)
}
export function deleteCycle(id: string): Promise<void> {
  return api.delete(`/api/gynecology-health/cycles/${id}`)
}

// ── Screenings ───────────────────────────────────────────────────────────────
export function getScreenings(params?: { patientId?: string; screeningType?: ScreeningType }): Promise<GynecologyScreening[]> {
  const q = new URLSearchParams(params as Record<string, string> || {}).toString()
  return api.get<GynecologyScreening[]>(`/api/gynecology-health/screenings${q ? '?' + q : ''}`)
}
export function createScreening(data: {
  patientId: string; doctorId: string; screeningType: ScreeningType; testDate: string
  resultSummary?: string; isNormal?: boolean; nextDueDate?: string; treatmentGiven?: string; notes?: string
}): Promise<GynecologyScreening> {
  return api.post<GynecologyScreening>('/api/gynecology-health/screenings', data)
}
export function deleteScreening(id: string): Promise<void> {
  return api.delete(`/api/gynecology-health/screenings/${id}`)
}

// ── Contraceptive devices ───────────────────────────────────────────────────
export function getDevices(params?: { patientId?: string }): Promise<ContraceptiveDevice[]> {
  const q = new URLSearchParams(params as Record<string, string> || {}).toString()
  return api.get<ContraceptiveDevice[]>(`/api/gynecology-health/devices${q ? '?' + q : ''}`)
}
export function createDevice(data: {
  patientId: string; doctorId: string; deviceType: string; insertionDate: string
  plannedRemovalDate?: string; notes?: string
}): Promise<ContraceptiveDevice> {
  return api.post<ContraceptiveDevice>('/api/gynecology-health/devices', data)
}
export function updateDevice(id: string, data: Partial<{
  status: ContraceptiveStatus; actualRemovalDate: string; notes: string
}>): Promise<ContraceptiveDevice> {
  return api.put<ContraceptiveDevice>(`/api/gynecology-health/devices/${id}`, data)
}

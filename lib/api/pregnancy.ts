import api from '@core/lib/api-client'
import type { Pregnancy, PregnancyStatus } from '@/types/specialty'

export function getPregnancies(params?: { patientId?: string; status?: PregnancyStatus }): Promise<Pregnancy[]> {
  const q = new URLSearchParams(params as Record<string, string> || {}).toString()
  return api.get<Pregnancy[]>(`/api/pregnancies${q ? '?' + q : ''}`)
}

export function createPregnancy(data: {
  patientId: string; doctorId: string; lmpDate: string; eddDate?: string; notes?: string
}): Promise<Pregnancy> {
  return api.post<Pregnancy>('/api/pregnancies', data)
}

export function updatePregnancy(id: string, data: Partial<{
  eddDate: string; status: PregnancyStatus; notes: string
}>): Promise<Pregnancy> {
  return api.put<Pregnancy>(`/api/pregnancies/${id}`, data)
}

export function addPrenatalVisit(pregnancyId: string, data: {
  doctorId: string; visitDate: string; gestationalWeek?: number; fundalHeightCm?: number
  bpSystolic?: number; bpDiastolic?: number; weightKg?: number; fetalHeartbeatBpm?: number; notes?: string
}): Promise<Pregnancy> {
  return api.post<Pregnancy>(`/api/pregnancies/${pregnancyId}/visits`, data)
}

export function deletePregnancy(id: string): Promise<void> {
  return api.delete(`/api/pregnancies/${id}`)
}

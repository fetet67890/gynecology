// Gynecology-only types — pregnancy/prenatal tracking + menstrual cycle/
// screening/contraceptive health tracking. Not part of
// @hypocrates/core-dashboard's shared types since no other specialty has
// these clinical concepts.

export type PregnancyStatus = 'aktive' | 'perfunduar' | 'nderprere'

export interface PrenatalVisit {
  id: string
  pregnancyId: string
  doctorId: string
  doctorName: string
  visitDate: string
  gestationalWeek?: number
  fundalHeightCm?: number
  bpSystolic?: number
  bpDiastolic?: number
  weightKg?: number
  fetalHeartbeatBpm?: number
  notes?: string
  createdAt: string
  /** True when bpSystolic >= 140 or bpDiastolic >= 90 — see
   *  pregnancy.controller.js's buildVisit() for the exact threshold. */
  bpFlag: boolean
}

export interface Pregnancy {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  lmpDate: string
  eddDate: string
  status: PregnancyStatus
  notes?: string
  createdAt: string
  visits: PrenatalVisit[]
}

export type CycleFlow = 'e_lehte' | 'normale' | 'e_rende'

export interface MenstrualCycle {
  id: string
  patientId: string
  doctorId?: string
  cycleStartDate: string
  cycleLengthDays?: number
  flow?: CycleFlow
  symptoms?: string
  notes?: string
  createdAt: string
}

export type ScreeningType = 'pap' | 'sti' | 'hormonal'

export interface GynecologyScreening {
  id: string
  patientId: string
  doctorId: string
  doctorName: string
  screeningType: ScreeningType
  testDate: string
  resultSummary?: string
  isNormal: boolean
  nextDueDate?: string
  treatmentGiven?: string
  notes?: string
  createdAt: string
}

export type ContraceptiveStatus = 'aktiv' | 'hequr' | 'skaduar'

export interface ContraceptiveDevice {
  id: string
  patientId: string
  doctorId: string
  doctorName: string
  deviceType: string
  insertionDate: string
  plannedRemovalDate?: string
  actualRemovalDate?: string
  status: ContraceptiveStatus
  notes?: string
  createdAt: string
}

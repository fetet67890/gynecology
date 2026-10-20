// Gynecology's parameters for @hypocrates/core-dashboard's generic
// extension points. See packages/core-dashboard/lib/specialty-config.ts for
// what each key does — this file only needs to declare what Gynecology
// adds/overrides.
//
// Pregnancy/prenatal tracking (see GYNECOLOGY-FEATURES.md) is now a real
// specialty module — components/patient/patient-card.tsx and every
// pacientet/[id]/page.tsx are per-app overrides, not the shared generic
// versions, the same reasoning Dental/Dermatology's own overrides document.
import type { DashboardSpecialtyConfig } from '@core/lib/specialty-config'

export const specialtyConfig: DashboardSpecialtyConfig = {
  brandName: 'Hypocrates Gynecology',
  brandDescriptionSq: 'Platformë moderne për menaxhimin e klinikave gjinekologjike',
  brandDescriptionEn: 'Modern platform for managing gynecology clinics',
  sidebarIconName: 'gynecology',

  navExtras: {
    admin: [],
    doktor: [],
  },

  settingsExtraSection: undefined,

  documentConfig: {
    categories: ['general', 'id_card', 'insurance_card', 'clinical_photo'],
    imageSubtypes: ['klinike', 'ultratingull', 'para', 'pas', 'tjeter'],
    batchCategory: 'clinical_photo',
  },

  patientExtraFields: [],
  featureFlags: {},

  tourExtraSteps: {
    admin: [],
    doktor: [],
  },

  // The fork's own lib/constants.ts still had Dental's literal treatment
  // list ("Mbushje kompozite", "Nxjerrje dhëmbi", "Implant dentar"...) —
  // never relabeled after forking. Replaced here with gynecology-appropriate
  // free-text suggestions, same as Dental's/Dermatology's own lists.
  treatmentTypes: [
    'Kontroll gjinekologjik',
    'Ekzaminim Pap Test',
    'Ultratingull gjinekologjik',
    'Kontroll shtatzënie',
    'Ultratingull i shtatzënisë',
    'Konsultë planifikimi familjar',
    'Vendosje spirale',
    'Heqje spirale',
    'Kolposkopi',
    'Biopsi e qafës së mitrës',
    'Trajtim infeksioni vaginal',
    'Konsultë menopauze',
    'Testim hormonal',
    'Konsultë steriliteti',
  ],

  entityDeleteHandlers: [],
}

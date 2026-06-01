/**
 * Curated, abbreviated office names and their units for the PRO4A
 * (CALABARZON) region. Used by the vehicle Add/Edit form dropdowns.
 *
 * Add or edit entries here to change the available offices/units.
 */
export const OFFICE_UNIT_MAP: Record<string, string[]> = {
  'Cavite PPO': [
    'Alfonso MPS', 'Amadeo MPS', 'Bacoor CCPS', 'Carmona CCPS', 'Cavite CCPS',
    'Dasmariñas CCPS', 'Gen. Emilio Aguinaldo MPS', 'Gen. Mariano Alvarez MPS',
    'Gen. Trias CCPS', 'Imus CCPS', 'Indang MPS', 'Kawit MPS', 'Magallanes MPS',
    'Maragondon MPS', 'Mendez MPS', 'Naic MPS', 'Noveleta MPS', 'Rosario MPS',
    'Silang MPS', 'Tagaytay CCPS', 'Tanza MPS', 'Ternate MPS', 'Trece Martires CCPS',
  ],
  'Laguna PPO': [
    'Alaminos MPS', 'Bay MPS', 'Biñan CCPS', 'Cabuyao CCPS', 'Calamba CCPS', 'Calauan MPS',
    'Cavinti MPS', 'Kalayaan MPS', 'Liliw MPS', 'Los Baños MPS', 'Luisiana MPS', 'Lumban MPS',
    'Mabitac MPS', 'Magdalena MPS', 'Majayjay MPS', 'Nagcarlan MPS', 'Paete MPS', 'Pagsanjan MPS',
    'Pakil MPS', 'Pangil MPS', 'Pila MPS', 'Rizal MPS', 'San Pablo CCPS', 'San Pedro CCPS',
    'Santa Cruz MPS', 'Santa Maria MPS', 'Santa Rosa CCPS', 'Siniloan MPS', 'Victoria MPS',
  ],
  'Batangas PPO': [
    'Agoncillo MPS', 'Alitagtag MPS', 'Balayan MPS', 'Balete MPS', 'Batangas CCPS',
    'Bauan MPS', 'Calaca CCPS', 'Calatagan MPS', 'Cuenca MPS',
    'Ibaan MPS', 'Laurel MPS', 'Lemery MPS', 'Lian MPS', 'Lipa CCPS',
    'Lobo MPS', 'Mabini MPS', 'Malvar MPS', 'Mataas na Kahoy MPS', 'Nasugbu MPS',
    'Padre Garcia MPS', 'Rosario MPS', 'San Jose MPS', 'San Juan MPS', 'San Luis MPS',
    'San Nicolas MPS', 'San Pascual MPS', 'Santa Teresita MPS', 'Santo Tomas CCPS',
    'Taal MPS', 'Talisay MPS', 'Tanauan CCPS', 'Taysan MPS', 'Tingloy MPS', 'Tuy MPS',
  ],
  'Rizal PPO': [
    'Angono MPS', 'Antipolo CCPS', 'Baras MPS', 'Binangonan MPS', 'Cainta MPS',
    'Cardona MPS', 'Jalajala MPS', 'Morong MPS', 'Pililla MPS', 'Rodriguez MPS',
    'San Mateo MPS', 'Tanay MPS', 'Taytay MPS', 'Teresa MPS',
  ],
  'Quezon PPO': [
    'Agdangan MPS', 'Atimonan MPS', 'Buenavista MPS', 'Burdeos MPS', 'Calauag MPS',
    'Candelaria MPS', 'Catanauan MPS', 'Dolores MPS', 'Famy MPS', 'General Luna MPS', 'General Nakar MPS',
    'Guinayangan MPS', 'Gumaca MPS', 'Infanta MPS', 'Jomalig MPS', 'Lopez MPS',
    'Lucban MPS', 'Lucena CCPS', 'Macalelon MPS', 'Mauban MPS', 'Mulanay MPS',
    'Pagbilao MPS', 'Panukulan MPS', 'Patnanungan MPS', 'Polillo MPS', 'Quezon MPS',
    'Real MPS', 'Sampaloc MPS', 'Sariaya MPS', 'Tagkawayan MPS', 'Tiaong MPS', 'Unisan MPS',
  ],
};

/** Office dropdown options: PRO4A HQ first, then the provincial offices. */
export const RLRDD_OFFICES: string[] = ['PRO4A', ...Object.keys(OFFICE_UNIT_MAP)];

/** Units mapped to a given office (empty when the office has no preset units). */
export function getOfficeUnits(office: string | null | undefined): string[] {
  if (!office) {
    return [];
  }
  return OFFICE_UNIT_MAP[office.trim()] ?? [];
}

export const israelCities = [
  'Tel Aviv',
  'Jaffa',
  'Jerusalem',
  'Haifa',
  'Herzliya',
  'Netanya',
  'Ramat Gan',
  'Givatayim',
  'Ramat Hasharon',
  "Ra'anana",
  'Kfar Saba',
  'Hod Hasharon',
  'Petah Tikva',
  'Rishon LeZion',
  'Holon',
  'Bat Yam',
  'Rehovot',
  'Yavne',
  'Ashdod',
  'Ashkelon',
  "Modi'in",
  "Be'er Sheva",
  'Eilat',
  'Dead Sea',
  'Caesarea',
  'Zichron Yaakov',
  'Nazareth',
  'Tiberias',
  'Acre',
  'Safed',
  'Galilee',
] as const

export type IsraelCity = (typeof israelCities)[number]

/** Koh Samui is first because that is the launch. */
export const thailandPlaces = [
  'Koh Samui',
  'Chaweng',
  'Lamai',
  'Bophut',
  'Maenam',
  'Choeng Mon',
  'Koh Phangan',
  'Koh Tao',
  'Surat Thani',
  'Bangkok',
  'Phuket',
  'Krabi',
  'Koh Phi Phi',
  'Koh Lanta',
  'Pattaya',
  'Hua Hin',
  'Chiang Mai',
  'Chiang Rai',
  'Ayutthaya',
  'Kanchanaburi',
] as const

export type ThailandPlace = (typeof thailandPlaces)[number]

export const placeGroups = [
  { country: 'thailand' as const, places: thailandPlaces },
  { country: 'israel' as const, places: israelCities },
]

export function isWorkPlace(value: string): boolean {
  return (thailandPlaces as readonly string[]).includes(value) || (israelCities as readonly string[]).includes(value)
}

export const equipmentOptions = [
  { value: 'phone', label: 'Phone' },
  { value: 'camera', label: 'Camera' },
  { value: 'camera-drone', label: 'Camera and drone' },
  { value: 'drone', label: 'Drone' },
] as const

export const experienceOptions = [
  { value: 'lt1', label: 'Under 1 year' },
  { value: 'y1-2', label: '1–2 years' },
  { value: 'y3-5', label: '3–5 years' },
  { value: 'y6-10', label: '6–10 years' },
  { value: 'y10plus', label: 'More than 10 years' },
] as const

export const availabilityOptions = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'any', label: 'Any day' },
] as const

export const rateOptions = [150, 250, 350, 500, 750, 1000] as const

export type EquipmentChoice = (typeof equipmentOptions)[number]['value']
export type ExperienceChoice = (typeof experienceOptions)[number]['value']
export type AvailabilityChoice = (typeof availabilityOptions)[number]['value']

export function isIsraelCity(value: string): value is IsraelCity {
  return (israelCities as readonly string[]).includes(value)
}

export function choiceLabel(value: string, options: readonly { value: string; label: string }[]): string {
  return options.find((option) => option.value === value)?.label ?? value
}

/** 选股条件本地持久化（PC / 移动分 key） */

export const PC_SCREEN_FILTERS_KEY = 'chanstock_screen_filters_v1'
export const MOBILE_SCREEN_FILTERS_KEY = 'chanstock_m_screen_filters_v1'

export type PcScreenFilters = {
  change_pct_min: number | null
  change_pct_max: number | null
  volume_min: number | null
  volume_max: number | null
  industry: string
  pe_max: number | null
  pb_max: number | null
  dual_cross: boolean
  level: string
  pool_size: number
  selectedSignals: string[]
}

export type MobileScreenFilters = {
  change_pct_min?: number
  change_pct_max?: number
  volume_min?: number
  volume_max?: number
  pe_max?: number
  pb_max?: number
  signals: string
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

export function loadPcScreenFilters(): Partial<PcScreenFilters> | null {
  return readJson<Partial<PcScreenFilters>>(PC_SCREEN_FILTERS_KEY)
}

export function savePcScreenFilters(data: PcScreenFilters) {
  writeJson(PC_SCREEN_FILTERS_KEY, data)
}

export function loadMobileScreenFilters(): Partial<MobileScreenFilters> | null {
  return readJson<Partial<MobileScreenFilters>>(MOBILE_SCREEN_FILTERS_KEY)
}

export function saveMobileScreenFilters(data: MobileScreenFilters) {
  writeJson(MOBILE_SCREEN_FILTERS_KEY, data)
}

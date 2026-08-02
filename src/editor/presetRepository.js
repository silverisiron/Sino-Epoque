import { normalizePreset } from '../map/presetSchema'

export async function fetchNormalizedPreset(path) {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`프리셋 로드 실패: ${response.status}`)
  }

  return normalizePreset(await response.json())
}

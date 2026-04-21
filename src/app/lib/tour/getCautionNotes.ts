import type { CompanionFilterState, TourAccessibilityFlags } from './companionFilterTypes'
import { hasAnyCompanionFilter } from './companionFilterConfig'

export function getCautionNotes(flags: TourAccessibilityFlags, filter: CompanionFilterState): string[] {
  const notes: string[] = []
  if (!hasAnyCompanionFilter(filter)) return notes

  if (filter.strollerFriendly) {
    if (!flags.strollerFieldRaw) {
      notes.push('유모차 입장·이동 관련 공식 안내 문구가 응답에 없어 비교가 제한됩니다.')
    } else if (flags.strollerFromKorWith === 'partial') {
      notes.push('유모차 관련 안내가 조건부·부분적 표현입니다. 방문 전 시설 측 확인을 권장합니다.')
    }
  }

  if (filter.wheelchairFriendly && !flags.wheelchairHintFromText) {
    notes.push('휠체어 접근·경사로 등은 TourAPI 공통 필드에 직접 값이 없어, 안내 텍스트 기반 힌트만 제공합니다.')
  }

  if (filter.parkingNeeded && !flags.parkingHintFromText) {
    notes.push('주차 정보는 안내 텍스트에서 확인되지 않았습니다. [추론·문구 검색 한계]')
  }

  if (filter.restroomImportant && !flags.restroomHintFromText) {
    notes.push('화장실·수유 관련 문구가 안내에서 확인되지 않았습니다.')
  }

  return notes
}

# i18n 운영 워크플로

## 운영 언어 정책

- 활성(운영) 언어: `ko`, `en`, `ja`, `zh-CN`, `zh-TW`
- 비운영 언어: `ar`, `ru` (파일은 유지, UI 비노출)
- 기준 언어(source of truth): `ko`

## Locale 구조 원칙

- `ko`: 기준 메시지 전체 키를 관리
- `en`: 우선 검수 언어 (핵심 UX 문구 품질 유지)
- `ja`, `zh-CN`, `zh-TW`: `mergeDeep(ko, overrides)` 구조
  - 검수된 문구만 `overrides`에 작성
  - 신규 키 누락은 `ko`에서 자동 fallback

## 신규 key 추가 순서

1. `ko` locale에 새 키 추가
2. 코드에서 `t("...")` 연결
3. `pnpm run check:i18n` 실행
4. `en`에 필요한 핵심 문구 검수 반영
5. `ja/zh-CN/zh-TW`는 필요 문구만 `overrides` 반영

## check:i18n 사용법

- 기본(운영 언어만 검사):
  - `pnpm run check:i18n`
- 전체 locale 검사(비운영 포함):
  - `pnpm run check:i18n:all`

## blank 예외 정책

- 의도적으로 비워둘 수 있는 키는 `scripts/check-i18n.ts`의
  `IGNORE_BLANK_KEYS`에 등록
- 현재 등록 키: `entry.heroLine2`

## 비운영 언어(ar/ru) 처리

- locale 파일은 남겨서 재오픈 가능성 유지
- 언어 선택 UI에서는 노출하지 않음
- 저장소에 예전 `ar/ru`가 남아 있어도 앱 진입 시 기본 언어로 복귀


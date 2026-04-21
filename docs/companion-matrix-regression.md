# Companion Matrix Regression Template

이 문서는 companions 추천 규칙의 회귀 검증을 위해 A~E 시나리오를 동일 포맷으로 기록한다.

## Run Metadata

- date:
- commit:
- env:
- dataset note:

## Scenario Matrix (A~E)

| scenario | candidateCount | survivingCount | excludedCount | exclusionRatio | hardExcludeCount | semiHardExcludeCount | savedByOverrideSignalCount | avgEffectiveAccessibilityScore | avgCompanionFit | finalScoreMin | finalScoreMax | top10Titles | excludedReasonDistribution |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| A-none |  |  |  |  |  |  |  |  |  |  |  |  |
| B-wheelchair |  |  |  |  |  |  |  |  |  |  |  |  |
| C-stroller |  |  |  |  |  |  |  |  |  |  |  |  |
| D-elderly |  |  |  |  |  |  |  |  |  |  |  |  |
| E-stroller-wheelchair |  |  |  |  |  |  |  |  |  |  |  |  |

## Console Raw Logs (Paste)

아래 키를 포함한 콘솔 원문(JSON)을 각 1회 실행 결과로 붙여넣는다.

- `[recommend] excluded count`
- `[recommend] excluded by hard reason count`
- `[recommend] excluded by semi-hard count`
- `[recommend] excluded reason distribution`
- `[recommend] final top 10 with companion match info`
- `[recommend] candidate/surviving summary`
- `[recommend][safety] high exclusion ratio detected`
- `[recommend][safety] strict filtering left very few candidates`
- `[recommend][safety] override signals missing in current dataset`
- `[recommend][matrix] A-none`
- `[recommend][matrix] B-wheelchair`
- `[recommend][matrix] C-stroller`
- `[recommend][matrix] D-elderly`
- `[recommend][matrix] E-stroller-wheelchair`

## Analysis Checklist

- stroller+wheelchair의 excludedCount가 single보다 큰가?
- hard/semi-hard 비중이 의도와 맞는가?
- top10에서 저이동성 고위험군이 충분히 하락/제외됐는가?
- `category-risk-overridden-by-accessibility`가 과도하게 0 또는 과도하게 높은가?
- `missing-accessibility-info`가 과도하면 구조화 접근성 데이터 보강/보수 정책 재검토가 필요한가?

## Final Verification Fields

- overrideExamples:
- hardExcludeExamples:
- tuningDecision: (deferred / applied)
- tuningReason:

## Latest Run Snapshot (2026-04-20)

### 10-row sample (baseline)

| scenario | excludedCount | hardExcludeCount | semiHardExcludeCount | savedByOverrideSignalCount | avgEffectiveAccessibilityScore | avgCompanionFit | finalScoreMin | finalScoreMax |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A-none | 0 | 0 | 0 | 0 | 0 | 50 | 48 | 49 |
| B-wheelchair | 5 | 0 | 5 | 0 | 52 | 48 | 58 | 69 |
| C-stroller | 5 | 0 | 5 | 0 | 52 | 49 | 60 | 66 |
| D-elderly | 6 | 0 | 6 | 0 | 53 | 45 | 58 | 66 |
| E-stroller-wheelchair | 9 | 0 | 9 | 0 | 46 | 24 | 51 | 51 |

### 50-row sample (DEV expanded)

| scenario | excludedCount | hardExcludeCount | semiHardExcludeCount | savedByOverrideSignalCount | avgEffectiveAccessibilityScore | avgCompanionFit | finalScoreMin | finalScoreMax |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A-none | 0 | 0 | 0 | 0 | 0 | 50 | 48 | 48 |
| B-wheelchair | 19 | 0 | 19 | 0 | 59 | 57 | 67 | 70 |
| C-stroller | 19 | 0 | 19 | 0 | 59 | 51 | 65 | 67 |
| D-elderly | 22 | 0 | 22 | 0 | 59 | 50 | 64 | 66 |
| E-stroller-wheelchair | 46 | 0 | 46 | 0 | 52 | 35 | 51 | 63 |

### Notes

- `savedByOverrideSignalCount=0` 이 연속 관측되어 override 경로 실증은 실패(데이터 신호 부족/임계값 엄격성 후보).
- `hardExcludeCount=0` 이 연속 관측되어 explicit 불가 텍스트/구조화 신호 자체가 샘플에 부족한 상태.
- `exclusionRatio`와 `survivingCount`를 함께 기록해 과대 제외(E 조합) 리스크를 운영 중 감시.
- tuningDecision: deferred
- tuningReason:
  - override/hard triggering signals absent in current dataset
  - avoid weakening safety constraints without evidence
  - re-evaluate after structured accessibility samples are collected

## Next Round Revalidation Checklist

- structured accessibility yes 신호가 포함된 샘플 확보
- explicit no 문구/구조 신호가 포함된 샘플 확보
- override examples 최소 1건 이상 확인
- hard exclude examples 최소 1건 이상 확인
- 30~50건 이상에서 `savedByOverrideSignalCount > 0` 확인
- 위 조건 충족 후에만 threshold 소폭 조정 검토

## Safety Flags

- lowCandidateMode:
  - `survivingCount <= 2` 또는 `exclusionRatio >= 0.85` 일 때 활성
  - 의미: 조건이 매우 엄격해 추천 후보가 부족한 상태

- overrideInactive:
  - `savedByOverrideSignalCount === 0` && `excludedCount > 0` 일 때 활성
  - 의미: override(예외 허용) 경로가 현재 데이터셋에서 실증되지 않음

운영 주의:
- 두 플래그가 동시에 `true`면 과대 필터 가능성이 있음
- 이 경우 threshold 완화보다 데이터 보강 후 재검증을 우선

## Summary

- key findings:
- under-filter risk:
- over-filter risk:
- tuning applied:
- next action:


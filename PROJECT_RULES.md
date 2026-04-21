# BSTRAVEL 프로젝트 규칙

- **항상 `D:\BSTRAVEL`를 열어 작업합니다.** (외장 SSD 메인 작업 폴더)
- **C:\ 등 다른 드라이브의 복사본에서는 작업하지 않습니다.** (경로 혼동·분실 방지)
- **큰 변경 전에는 백업** (`backup.bat` 실행 또는 Git 커밋)을 권장합니다.

## Git (간단 워크플로)

- 작업 전: `git status`
- 작업 후: `git add .` → `git commit -m "daily: YYYYMMDD work"` 등
- 위험한 변경 전: 현재 상태를 커밋해 두기

## 백업

- 원클릭: 프로젝트 루트의 `backup.bat` 더블클릭
- 대상: `D:\backup\BSTRAVEL_YYYYMMDD` (같은 날짜 폴더가 있으면 `_HHMM` 추가, 기존 백업 덮어쓰지 않음)

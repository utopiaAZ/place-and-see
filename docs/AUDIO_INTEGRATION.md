# 오디오 통합

## 파일 구조

원본은 `source-assets/audio/raw`, 편집본은 `edited`, 승인된 마스터는 `exports`에 둡니다. Stage 1의
웹 배포 MP3 복제본은 `public/assets/audio/edited`에 있으며 원본은 수정하지 않습니다.

## 의미 이벤트 연결

Core/Stage는 파일명을 모르며 `GOAL_COMPLETED` 같은 의미 Event만 발생시킵니다. Stage 1 Manifest가
Event, 런타임 URL, marker, 볼륨, cooldown, 동시 재생 수와 loop 정책을 연결합니다.

카테고리는 `sfx`, `ui`, `loop`입니다. 최종 음량은 master, category, asset volume의 곱이며 0~1로
제한합니다. 상세 marker와 분석 결과는 `docs/audio/STAGE_001_AUDIO.md`를 참고합니다.

## 웹 활성화와 에셋 부재

브라우저 AudioContext는 최초 포인터/키보드/touch 입력 뒤 resume합니다. 자동 재생을
시도하지 않습니다. 매니페스트, playback port, entry 또는 source가 없거나 mute 상태면
`AudioManager`는 오류 없이 종료합니다. 가짜·무음 파일로 누락을 감추지 않습니다. 개발 모드에서
`?audioDebug=1`을 사용하면 marker와 활성 재생 목록을 확인할 수 있습니다.

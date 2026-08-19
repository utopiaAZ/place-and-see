# 오디오 통합

## 파일 구조

녹음/생성 직후의 무손실 WAV는 `source-assets/audio/raw`, 편집본은 `edited`, 승인된 WAV 마스터는
`exports`에 둡니다. 웹 배포용 OGG/MP3만 `public/assets/audio/{object,character,ui,feedback,ambience}`에
복사합니다. WAV 원본을 런타임에서 직접 참조하지 않습니다.

## 의미 이벤트 연결

Core/Stage는 `GOAL_COMPLETED` 같은 `SoundEvent`만 압니다. `AudioManifest`가 Event, 카테고리,
하나 이상의 variant key/source를 연결합니다. 같은 이벤트의 변형은 `variants` 배열에 추가하고
`weight`로 선택 가중치를 기록합니다. 현재 `AudioManager`는 첫 variant를 안전하게 선택하는 최소
구현이며, 무작위 선택은 반복 방지 정책과 테스트를 함께 추가할 때 구현합니다.

카테고리는 `object`, `character`, `ui`, `feedback`, `ambience`입니다. 최종 음량은 master와 category
값의 곱이며 모두 0~1로 검증하는 설정 UI를 다음 단계에서 추가합니다.

## 웹 활성화와 에셋 부재

브라우저 AudioContext와 Phaser sound는 최초 포인터/키보드 입력 뒤 resume합니다. 자동 재생을
시도하지 않습니다. 매니페스트, playback port, entry 또는 source가 없거나 mute 상태면
`AudioManager.play`는 오류 없이 종료합니다. 가짜·무음 파일로 누락을 감추지 않습니다.

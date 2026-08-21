# AI 사용 기록

AI로 만든 코드, 그래픽, 오디오 또는 문서가 최종 프로젝트에 들어갈 때 아래 항목을 복사해
한 작업 단위로 작성합니다. 사람이 검토하고 권리/출처를 확인하기 전에는 배포 에셋으로 옮기지 않습니다.

## 기록 템플릿

- 날짜:
- 사용 도구 및 모델:
- 작업 목적:
- 입력 또는 프롬프트 요약:
- 생성 결과:
- 사람이 검토·수정한 내용:
- 최종 사용 파일:
- 라이선스 또는 출처 확인:
- 검토자:
- 비고:

## 2026-08-20 — Stage 001 SVG 에셋

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex
- 작업 목적: 첫 번째 스테이지의 직접 편집 가능한 순수 SVG/XML 에셋과 고양이 파츠 rig 제작
- 입력 또는 프롬프트 요약: 제한 팔레트, 굵은 navy 외곽선, 단순 기하 형태, 2D 정면/얕은 윗면 시점
- 생성 결과: 책상·의자·선반, 물병·간식·장난감 쥐·미끄럼 방지 매트·물웅덩이, 고양이 8개 파츠/표정과 조립 미리보기, cat-rig.json, 1600×900 HTML 검수판
- 사람이 검토·수정할 내용: 실제 게임 표시 크기의 선 굵기, 고양이 파츠 회전 시 겹침, 표정 가독성, 책상 위 물병/매트 비율
- 최종 사용 파일: `source-assets/svg/` 원본 및 `public/assets/` 동일 구조 런타임 복제본
- 라이선스 또는 출처 확인: 외부 이미지·다운로드·Base64·기존 캐릭터 참조 없이 새 SVG/XML 코드로 작성
- 검토자: 추후 사람 검수 필요
- 비고: 최종 게임 코드에는 아직 연결하지 않음

## 2026-08-20 — Stage 1 수직 샘플

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex
- 작업 목적: React–Phaser–Core 구조 위에 플레이 가능한 Stage 1 규칙, 입력, rig, UI와 테스트 구현
- 입력 또는 프롬프트 요약: 결정적 고양이 상태 머신, 세 가지 해결법, SVG Manifest/rig, 3초 안정성 판정, 의미 기반 사운드 연결
- 생성 결과: Stage 데이터/Rule System/Command/Event 확장, 네 오브젝트 드래그, 고양이 파츠 애니메이션, 실패 및 성공 UI, Core 중심 테스트
- 사람이 검토·수정할 내용: 실제 브라우저에서의 코미디 타이밍, 작은 화면의 hit area, SVG 래스터화 선명도, 각 해결법의 발견 가능성
- 최종 사용 파일: `src/core`, `src/content`, `src/bridge`, `src/phaser`, `src/app`, `src/ui`, `src/audio`, `tests`, 관련 문서
- 라이선스 또는 출처 확인: 외부 코드·에셋을 다운로드하지 않았으며 저장소의 기존 SVG만 런타임에 연결
- 검토자: 추후 사람 플레이테스트 필요
- 비고: 실제 효과음 파일은 생성하거나 추가하지 않음

## 2026-08-20 — Stage 1 사운드 통합

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex, FFmpeg/ffprobe
- 작업 목적: 제공된 MP3를 기존 의미 기반 Event와 안전한 Web Audio 수명주기에 연결
- 입력 또는 프롬프트 요약: 원본 보존, 무음/음량 분석, marker 재생, 상태 기반 loop, autoplay/mute/QA, 브라우저 검증
- 생성 결과: typed Audio Manifest, Web Audio backend, landing/spill/rejected 표현 Event, Audio QA 패널과 검증/단위 테스트
- 사람이 검토·수정할 내용: marker 후보의 음색과 접합, water-spill/cat-toy 상대 음량, 실제 기기별 타이밍
- 최종 사용 파일: `public/assets/audio/edited`, `src/audio`, `docs/audio/STAGE_001_AUDIO.md`, 관련 Bridge/UI/Test
- 라이선스 또는 출처 확인: 제공된 파일의 출처·제작자·라이선스 정보가 없어 TODO로 유지
- 검토자: 추후 사람 청취 검수 필요
- 비고: 새 소리를 생성하거나 원본 MP3를 수정하지 않음

## 2026-08-20 — Stage 2 수직 샘플

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex
- 작업 목적: 회전 선풍기와 날아가는 서류를 주제로 한 두 번째 결정적 수직 샘플 구현
- 입력 또는 프롬프트 요약: 독립 Rule System, 플러그/물병/파일꽂이 세 해결법, 순수 SVG, Stage 전환, 의미 기반 오디오 수명주기
- 생성 결과: Stage 2 데이터와 Core 규칙, Fan/Paper Phaser View, 7개 SVG 원본·런타임 복제본, React 전환 UI, Core/Audio/layout 테스트와 문서
- 사람이 검토·수정할 내용: 선풍기 head와 blade 모션, 서류 flutter/blow-away 타이밍, drag hit area, 세 해결법 발견 가능성
- 최종 사용 파일: `src/content/stages/stage-002.ts`, `src/core/rules/StageTwoRuleSystem.ts`, Stage 2 Phaser/UI/Test/Docs, `source-assets/svg/props/stage-002`, `public/assets/props/stage-002`
- 라이선스 또는 출처 확인: 신규 SVG는 외부 이미지 없이 순수 SVG/XML로 작성. 요청된 Stage 2 MP3 3개는 저장소에 없어 추가하지 않음
- 검토자: 추후 사람 플레이테스트 필요
- 비고: Git commit/push 미수행

## 2026-08-20 — Stage 2 사운드 통합

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex, FFmpeg/ffprobe
- 작업 목적: 제공된 선풍기·서류 MP3 세 개를 기존 Stage 2 의미 이벤트와 오디오 수명주기에 연결
- 입력 또는 프롬프트 요약: 원본 보존, 런타임 복제, 파형·무음·레벨 분석, 짧은 loop/one-shot marker, QA와 검증
- 생성 결과: Stage 2 typed Audio Manifest, Stage별 Manifest registry, 런타임 MP3 3개, Audio QA 노출과 audio validator 확장
- 사람이 검토·수정할 내용: fan/flutter loop 접합, paper fall 종료점, 게임 연출과의 타이밍 및 상대 음량
- 최종 사용 파일: `src/audio/stage002AudioManifest.ts`, `src/audio/gameAudioManifest.ts`, `public/assets/audio/edited`, `docs/audio/STAGE_002_AUDIO.md`, 관련 UI/Test/Validator
- 라이선스 또는 출처 확인: 제공자·원본 URL·제작자·라이선스가 명시되지 않아 TODO 유지, 특정 제공자를 추측하지 않음
- 검토자: 프로젝트 소유자의 브라우저 청취 검수 필요
- 비고: 원본 MP3 내용과 Stage 1의 기존 11개 marker를 변경하지 않았으며 Git commit/push 미수행

## 2026-08-20 — Stage 3 복합 퍼즐과 행동 순서 설계

- 날짜: 2026-08-20
- 사용 도구 및 모델: Codex, FFmpeg/ffprobe
- 작업 목적: Stage 1의 고양이와 Stage 2의 선풍기를 결합한 마지막 복합 퍼즐, 케이크·촛불 연출, 의미 기반 오디오와 결정적 검증 구현
- 입력 또는 프롬프트 요약: 고양이와 airflow 위협을 각각 처리하고 케이크 배치·촛불 점화·3초 안정성을 달성하는 구조, 간식/장난감과 플러그/파일꽂이의 네 조합, 순수 SVG, `ADVANCE_TIME`, Audio QA와 회귀 테스트
- 생성 결과: Stage 3 데이터와 독립 Rule System, CakeView/Scene/drop resolver, SVG 6종, 신규 MP3 4종 Manifest, 촛불 점화 버그 수정, Core/Bridge/Phaser/Audio 테스트와 validator·문서
- 사람이 검토·수정한 내용: 프로젝트 소유자가 복합 퍼즐 방향·미션·네 가지 조합을 승인하고, 신규 효과음 파일을 직접 확보했으며, 실제 플레이와 Audio QA 청취로 퍼즐 난이도·시각 품질·marker·volume·게임 내 타이밍을 최종 승인
- 최종 사용 파일: `src/content/stages/stage-003.ts`, `src/core/rules/StageThreeRuleSystem.ts`, `src/phaser/scenes/StageThreeScene.ts`, `src/phaser/views/CakeView.ts`, `src/phaser/animation/stageThreeCakeMotion.ts`, `src/phaser/input/stageThreeDropResolver.ts`, `src/audio/stage003AudioManifest.ts`, Stage 3 SVG/MP3 원본·런타임 복제본, 관련 Test/Validator/Docs
- 라이선스 또는 출처 확인: 신규 그래픽은 외부 이미지·래스터 데이터·외부 폰트·gradient·filter 없이 기존 팔레트의 순수 SVG/XML로 작성. 신규 MP3의 원본 URL·제작자·라이선스는 제공되지 않아 `TODO: source metadata required` 유지
- 검토자: 프로젝트 소유자
- 비고: Stage 3 checkpoint는 `595e411`이며, 기존 Stage 1·2 규칙과 오디오 marker는 변경하지 않음

### 기획과 구현에서의 역할

사용자는 Stage 3를 앞선 두 Stage의 학습 내용을 결합한 마지막 복합 퍼즐로 결정하고, 미션을 `촛불을 켠 케이크를 책상 위에 준비하세요`로 확정했습니다. 고양이와 선풍기를 동시에 해결하는 구조와 간식·장난감/플러그·파일꽂이의 네 가지 조합도 사용자가 최종 승인했습니다. Codex는 두 위협을 분리한 상태 구조, 행동 순서와 안정성 조건, 상세 구현 프롬프트, 필요한 SVG·사운드 목록, 성공·실패 시나리오와 테스트 경계값을 구체화했습니다. 최종 기획은 AI가 독립적으로 결정한 것이 아니라 사용자의 선택과 승인에 따라 확정됐습니다.

Core와 Stage 데이터에는 케이크 위치·손상, 촛불, 고양이 위협, 선풍기와 airflow 상태를 두고, 장난감 5초와 성공 안정성 3초를 포함한 모든 시간을 `ADVANCE_TIME`으로 처리했습니다. `StageThreeRuleSystem`은 간식/장난감과 플러그/파일꽂이의 네 조합을 같은 성공 조건으로 판정합니다. Phaser에서는 `StageThreeScene`, `CakeView`, `stageThreeCakeMotion`, `stageThreeDropResolver`를 구현하고 cake/candle/flame/smoke 파츠, lit·flicker·blowout 연출, 기존 CatView/FanView 재사용과 Stage 2→3 전환을 연결했습니다.

신규 SVG는 `cake.svg`, `candle.svg`, `flame.svg`, `lighter.svg`, `cake-damage-overlay.svg`, `smoke-puff.svg`입니다. 모두 순수 SVG/XML이며 외부 이미지, 래스터 데이터, 외부 폰트, gradient와 filter 없이 기존 단색 팔레트를 유지했습니다.

### 촛불 점화 문제 진단과 수정

사용자가 실제 Stage 3 플레이 중 라이터를 촛불에 놓아도 점화되지 않는 현상을 발견하고 구체적으로 보고했으며, 수정 결과도 직접 플레이해 승인했습니다. 이 보고를 바탕으로 Codex를 활용해 `lighter drag → StageThreeScene → stageThreeDropResolver → GameBridge → StageThreeRuleSystem → Snapshot → CakeView` 전체 경로를 추적했습니다.

확인된 원인은 이동한 케이크의 현재 촛불 위치 대신 정적인 Stage 좌표를 사용한 점, 라이터 전체 bounds가 아니라 중심점만 검사한 점, candle과 desk zone이 겹칠 때 일반 desk drop이 먼저 선택될 수 있던 점, `CakeView.setDisplaySize()` 뒤 flame scale을 절대값으로 덮어쓴 점이었습니다. CakeView의 현재 world transform 기반 ignition bounds, lighter/candle bounds 교차 판정, 일반 desk보다 높은 ignition 우선순위, 전용 `LIGHT_CANDLE` Command와 결정적인 `lighting → lit` 전이, flame base scale 보존, wick과 flame bottom-center 정렬, 재점화 시 이전 blowout Tween 정리로 수정했습니다. 문제 발견은 사용자의 실제 플레이에서 시작됐으며 Codex는 원인 추적과 수정 구현을 지원했습니다.

### Stage 3 오디오 분석과 통합

사용자는 `cake-place-wood-01.mp3`, `cake-hit-01.mp3`, `candle-light-01.mp3`, `candle-blowout-01.mp3` 파일을 외부에서 확보하고 Audio QA에서 직접 청취해 최종 적합성을 승인했습니다. Codex는 길이·sample rate·channel·음량과 무음 구간을 분석하고 marker 후보를 제안했으며, Manifest/Event 연결, 원본·런타임 SHA-256 검증, Audio QA 확장, validator와 mock 테스트를 지원했습니다.

| Sound | Marker | Volume |
| --- | ---: | ---: |
| `cake-place-wood-01` | `500 + 350ms` | `0.58` |
| `cake-hit-01` | `0 + 130ms` | `1.00` |
| `candle-light-01` | `2650 + 350ms` | `0.78` |
| `candle-blowout-01` | `7000 + 1300ms` | `1.00` |

Blowout 사운드는 airflow로 꺼질 때만 재생하고 케이크 이동으로 꺼질 때는 생략합니다. 오디오 fetch/decode/playback 실패는 Core 상태 전이를 중단하지 않으며, Stage 1·2의 기존 marker는 변경하지 않았습니다. 출처 URL과 제작자 정보는 추측하지 않고 기존 TODO를 유지합니다.

### 테스트와 검증

Stage 3 Core 규칙과 네 해결 조합, 고양이 attack, candle lighting·flicker·blowout, 큰 tick/작은 tick 결정성, 시간 경계값, 잘못된 ID/zone, drop resolver, CakeView motion, GameBridge Event, AudioManager/Manifest, Stage·SVG·Audio validator, 직접 진입 query, canvas 중복 방지와 800×600 FIT을 검증했습니다. Stage 3 기능 및 오디오 통합 완료 시점에는 138개의 자동 테스트가 통과했고, 이후 게임 셸 구현으로 전체 테스트 수는 190개로 증가했습니다.

### 사용자와 Codex의 역할 구분

| 영역 | 사용자 | Codex |
| --- | --- | --- |
| 게임 방향 | 복합 퍼즐 방향 승인 | 구조와 대안 구체화 |
| 퍼즐 규칙 | 최종 선택과 난이도 판단 | 상태·조건·테스트 설계 |
| 에셋 | 스타일 승인 | SVG 제작·검증 지원 |
| 사운드 | 파일 확보와 청취 승인 | 분석·marker·Manifest 연결 |
| 버그 | 실제 플레이 중 발견 | 원인 추적과 수정 구현 지원 |
| 품질 | 최종 플레이 판단 | 자동 테스트와 브라우저 검증 지원 |

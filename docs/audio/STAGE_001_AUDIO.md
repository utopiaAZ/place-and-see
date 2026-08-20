# Stage 001 Audio

## 파일 위치와 편집 원칙

- 원본: `source-assets/audio/raw/*.mp3`
- 런타임 복제본: `public/assets/audio/edited/*.mp3`
- 타입 안전 Manifest: `src/audio/stage001AudioManifest.ts`

원본은 수정하지 않았다. 현재 런타임 파일은 원본의 동일 복제본이며 Web Audio marker로 필요한 구간만
재생한다. Marker는 `ffprobe`, `volumedetect`, `silencedetect=noise=-40dB:d=0.08` 결과를 기준으로 선정했고,
프로젝트 소유자가 게임 안에서 직접 청취하여 현재 구간과 음량을 승인했다.

`raw` 원본은 수정하거나 덮어쓰지 않으며, `edited`에는 게임에서 사용하는 런타임 복제본 또는 편집본만
둔다. 원본 파일은 별도 다운로드 에셋으로 제공하지 않고, GitHub나 배포 환경에서도 게임과 무관한 독립
에셋 팩으로 소개하지 않는다. 향후 실제로 잘라낸 배포 파일을 만들더라도 원본 출처 기록을 유지한다.
파일명이 변경될 때는 provenance가 끊기지 않도록 아래 런타임 파일 기준 출처 표도 함께 갱신한다.

## 원본 분석

무음 값은 인코딩과 임계값에 따라 달라지는 근사치다.

| 파일 | 길이 | Hz / 채널 | 평균 / 최대 | 선행 / 후행 무음 | 구성 판단 |
| --- | ---: | --- | --- | --- | --- |
| bottle-pickup-01.mp3 | 0.528s | 24000 / 2 | -22.3 / -3.8dB | 0 / 0.105s | 짧은 one-shot |
| bottle-place-01.mp3 | 51.672s | 48000 / 1 | -39.5 / -0.2dB | 0.702 / 0.733s | 다수의 짧은 후보 |
| bottle-fall-01.mp3 | 3.168s | 24000 / 2 | -36.2 / -6.6dB | 0.122 / 0.260s | 여러 충격이 이어진 composite one-shot 후보 |
| water-spill-01.mp3 | 1.032s | 24000 / 2 | -45.0 / -26.1dB | 약 0.31 / 0.183s | 매우 작은 one-shot |
| cat-chirp-01.mp3 | 7.608s | 24000 / 2 | -41.8 / -14.3dB | 0.279 / 0.730s | 여러 울음 후보 |
| step-wood-01.mp3 | 4.336s | 44100 / 1 | -21.3 / -0.4dB | 0 / 0.256s | 여러 발걸음 후보 |
| cat-landing.mp3 | 1.128s | 24000 / 2 | -32.7 / -3.1dB | 0 / 0.824s | 앞부분의 짧은 one-shot |
| error-pop-01.mp3 | 1.032s | 48000 / 2 | -25.7 / -2.0dB | 0 / 0.964s | 앞부분의 매우 짧은 one-shot |
| cat-eating-01.mp3 | 59.324s | 44100 / 2 | -45.4 / -2.6dB | 약 0.947 / 1.006s | 긴 연속 후보, 짧은 loop marker 필요 |
| cat-toy-01.mp3 | 17.328s | 48000 / 1 | -46.1 / -22.2dB | 0.367 / 0.525s | 여러 놀이 후보, 짧은 loop marker 필요 |
| success-01.mp3 | 3.408s | 24000 / 2 | -22.8 / -4.7dB | 0.104 / 0.140s | one-shot |

## Event 매핑과 marker

| Game/Sound Event | key | marker start + duration | volume | 정책 |
| --- | --- | ---: | ---: | --- |
| bottle `OBJECT_PICKED_UP` | bottle-pickup-01 | 0 + 430ms | 0.72 | 120ms cooldown |
| bottle `OBJECT_DROPPED` | bottle-place-01 | 1840 + 310ms | 0.45 | 150ms cooldown |
| `BOTTLE_FELL` | bottle-fall-01 | 100 + 2400ms | 0.65 | one-shot |
| `WATER_SPILLED` | water-spill-01 | 300 + 560ms | 1.00 | 낮은 원본 레벨 보정 후보 |
| `CAT_NOTICED_BOTTLE` | cat-chirp-01 | 260 + 540ms | 0.90 | one-shot |
| `CAT_PREPARING_JUMP` | step-wood-01 | 0 + 350ms | 0.50 | one-shot 후보 |
| `CAT_LANDED` | cat-landing | 0 + 340ms | 0.70 | one-shot |
| `OBJECT_DROP_REJECTED` | error-pop-01 | 0 + 120ms | 0.60 | 180ms cooldown |
| `CAT_EATING` | cat-eating-01 | 1000 + 4000ms | 0.85 | 상태 기반 loop |
| `CAT_PLAYING` | cat-toy-01 | 2250 + 2400ms | 1.00 | 상태 기반 loop |
| `GOAL_COMPLETED` | success-01 | 100 + 3170ms | 0.65 | Stage당 1회 |

`BOTTLE_WOBBLED`, `CAT_JUMPED`, `CAT_TAPPED_BOTTLE`, 안정성 시작/리셋과 UI reset은 적절한 전용
파일이 없어 재사용하지 않았다. 모든 최종 gain은 master × category × asset volume이며 1 이하로 제한된다.

## 루프와 브라우저 정책

먹기 루프는 `CAT_EATING` 진입 시 시작해 Stage 성공, reset, Scene/Bridge 종료에서 정지한다. 장난감 루프는
`CAT_PLAYING` 진입 시 시작하고 `CAT_RETURNING`, 성공, reset 또는 종료에서 정지한다. 같은 loop key는
중복 시작되지 않는다. 오디오는 최초 pointer/keyboard/touch 입력에서 unlock하며 그 이전 이벤트는 무시한다.

## 출처와 권리 정보

- Provider: Pixabay Sound Effects
- Provider URL: https://pixabay.com/sound-effects/
- License: Pixabay Content License
- License summary: https://pixabay.com/service/license-summary/
- Pixabay FAQ: https://pixabay.com/service/faq/
- Attribution: Not required
- Commercial use: Permitted under the Pixabay Content License
- Modification: Permitted under the Pixabay Content License
- Standalone redistribution: Not permitted
- Exact download date: TODO

Pixabay 콘텐츠는 게임과 같은 더 큰 창작물에 포함하여 사용할 수 있다. 다만 원본 또는 실질적으로 동일한
사운드를 독립적인 에셋 팩이나 다운로드 상품으로 판매·배포하지 않는다. 위 내용은 프로젝트의 출처 관리
요약이며 법률 자문이 아니다. 적용 시 Pixabay의 공식 라이선스 원문과 FAQ를 함께 확인한다.

선택적 크레딧 문구:

> Selected sound effects sourced from Pixabay.

> 일부 효과음은 Pixabay Sound Effects에서 제공받았습니다.

### 파일별 출처

| Runtime file | Provider | Original asset URL | Creator | License | Attribution | Review |
| --- | --- | --- | --- | --- | --- | --- |
| `bottle-fall-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `bottle-place-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `bottle-pickup-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `water-spill-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `cat-chirp-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `step-wood-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `error-pop-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `cat-eating-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `cat-toy-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `cat-landing.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |
| `success-01.mp3` | Pixabay Sound Effects | TODO | TODO | Pixabay Content License | Not required | Passed |

개별 Pixabay 에셋 URL, Pixabay 업로더 또는 제작자 이름, 정확한 다운로드 날짜는 제공된 기록이 없어
추측하지 않고 TODO로 유지한다.

## 사람 청취 검수

```text
Human listening review: Passed
Review date: 2026-08-20
Reviewer: Project owner
Result: All 11 Stage 1 sound effects were considered acceptable.
```

검수 완료 항목:

- 물병 집기, 배치, 넘어짐 및 물 쏟아짐 소리
- 고양이 chirp, 나무 표면 발소리 및 고양이 착지
- 잘못된 배치 UI 소리와 Stage 성공음
- 고양이 먹기 loop와 장난감 loop
- one-shot의 시작과 종료 및 먹기·장난감 loop 연결
- 효과음 간 상대 음량
- 기본 실패 흐름의 재생 순서
- 간식·장난감·매트 성공 흐름
- mute와 reset 이후 loop 정리

청취 환경은 별도로 기록되지 않았으므로 특정 브라우저, 헤드폰 또는 스피커 환경을 명시하지 않는다.

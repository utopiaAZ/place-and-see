# Stage 2 오디오

## 현재 상태

Stage 2 원본 MP3 세 개를 분석해 런타임 복제본과 타입 안전 Manifest에 등록했습니다.
marker는 파형·무음·레벨 분석으로 선정한 뒤 프로젝트 소유자의 직접 플레이 청취 검수를 통과했습니다.

## 사람 청취 검수

- Human listening review: Passed
- Review date: 2026-08-20
- Reviewer: Project owner
- Result: Stage 2 fan loop, paper flutter loop and paper fall sound were accepted during direct gameplay review.

| Runtime key | Expected source | Expected runtime | Known full duration | Marker | Volume | Loop |
| --- | --- | --- | ---: | --- | --- | --- |
| `fan-loop-01` | `source-assets/audio/raw/fan-loop-01.mp3` | `public/assets/audio/edited/fan-loop-01.mp3` | 22,176ms | 8,000 + 4,000ms | 0.42 | Yes |
| `paper-flutter-01` | `source-assets/audio/raw/paper-flutter-01.mp3` | `public/assets/audio/edited/paper-flutter-01.mp3` | 54,552ms | 13,000 + 4,000ms | 0.72 | Yes |
| `paper-fall-01` | `source-assets/audio/raw/paper-fall-01.mp3` | `public/assets/audio/edited/paper-fall-01.mp3` | 6,975ms | 0 + 2,500ms | 0.78 | No |

분석 메모:

- `fan-loop-01`: 24kHz stereo, 평균 -21.7dB, 최대 -6.0dB. 뚜렷한 무음 없이 이어지는 구간 중 8~12초를 선택했습니다.
- `paper-flutter-01`: 24kHz stereo, 평균 -35.6dB, 최대 -1.3dB. 여러 후보가 분리된 파일이며 13~17초를 선택했습니다.
- `paper-fall-01`: 44.1kHz stereo, 평균 -31.0dB, 최대 -12.8dB. 6.975초 전체 대신 첫 2.5초를 one-shot 후보로 사용합니다.
- `cooldownMs`: `paper-fall-01` 800ms. 모든 Stage 2 사운드는 `maxInstances: 1`입니다.

브라우저에서 `?stage=002&audioDebug=1`로 marker의 시작·종료, 상대 음량, loop 접합을 청취 검수할 수 있습니다.

## 이벤트와 수명주기

| Game Event / 상태 | Sound Event 동작 |
| --- | --- |
| unlock 후 powered snapshot / `FAN_STARTED` | fan loop 시작, 중복 금지 |
| `FAN_STOPPED` | fan loop 정지 |
| `PAPER_FLUTTER_STARTED` | paper flutter loop 시작, 중복 금지 |
| `PAPER_FLUTTER_STOPPED` / `PAPER_BLOWN_AWAY` | flutter loop 정지 |
| `PAPER_BLOWN_AWAY` | paper fall one-shot 1회 |
| reset | 모든 loop 정리 후 powered fan 재평가 |
| 성공, mute, Scene/Bridge destroy | Stage 2 행동 loop 정리 |

`GOAL_COMPLETED`, 잘못된 drop, 물병 집기·배치는 Stage 1의 기존 success/error/bottle 정의를 재사용합니다.
오디오 출력 여부는 Core 시뮬레이션에 영향을 주지 않습니다.

## 출처

- License: TODO: source metadata required
- Original asset URL: TODO: source metadata required
- Creator: TODO: source metadata required
- Attribution requirement: TODO: source metadata required

출처가 명시되지 않았으므로 Pixabay 등 특정 제공자를 추측하지 않습니다.

## 향후 환경별 재검수 항목

현재 marker, loop 접합, 연출 타이밍과 상대 음량은 직접 플레이 검수를 통과했습니다. 향후 지원 환경이나
재생 backend가 변경되면 같은 Audio QA 절차로 회귀 검수합니다. 확인되지 않은 청취 장비나 브라우저는
기록하지 않습니다.

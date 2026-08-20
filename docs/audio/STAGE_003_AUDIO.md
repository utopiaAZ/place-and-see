# Stage 3 오디오

## 통합 상태

Stage 3 원본 MP3 네 개는 `source-assets/audio/raw/`, 동일 bytes의 런타임 복제본은 `public/assets/audio/edited/`에서 관리합니다. 원본을 편집하거나 재인코딩하지 않았으며, 아래 marker와 volume은 파형·무음·레벨 분석 뒤 프로젝트 소유자의 게임 내 청취 검수를 거쳐 확정했습니다.

분석 도구는 FFmpeg/FFprobe 7.0.1입니다. 무음 구간은 `silencedetect=noise=-45dB:d=0.04` 기준이며, 이 임계값은 절대적인 음향 의미 판정이 아닙니다.

## Human listening review

Human listening review: Passed

Reviewer: Project owner

Result: The four Stage 3 sound effects and their in-game timing were accepted.

검수 대상은 `cake-place-wood-01.mp3`, `cake-hit-01.mp3`, `candle-light-01.mp3`, `candle-blowout-01.mp3`입니다. 현재 marker, volume, cooldown, Event mapping과 airflow/movement blowout 정책을 승인된 체크포인트 값으로 유지합니다.

## 파일 분석과 SHA-256

| 파일 | 길이 | Sample rate / channel | Bitrate | 전체 mean / max | 선행·후행 무음 | SHA-256 |
| --- | ---: | --- | ---: | --- | --- | --- |
| `cake-place-wood-01.mp3` | 36,192ms | 24kHz / Stereo | 160kbps | -40.0 / -1.0dB | 524ms / 544ms | `5ea85955e5392fb82a36d923e4a8a1c0062af79c6797773c91378ac5de2a747d` |
| `cake-hit-01.mp3` | 130.600ms | 22.05kHz / Mono | 160kbps | -30.4 / -12.3dB | 51.746ms / 검출 없음 | `4bb22b5ec915b78b5856f1f0bf5fa123a7fc185b6c6599c515e8efad21bc054c` |
| `candle-light-01.mp3` | 6,768ms | 24kHz / Stereo | 160kbps | -42.1 / -2.2dB | 유효 onset 약 1,091ms / 925ms | `266185cba7e7080ac934a1930f2921f8eaed467cd84e0803acf56ed15850476f` |
| `candle-blowout-01.mp3` | 11,102.031ms | 44.1kHz / Mono | 256kbps | -43.1 / -18.8dB | 622ms / 주 tail silence 약 506ms | `aa7b80aa19cbf3007dec68e520ea65d7de40b26bbe518728e6eb2d13788ae86d` |

모든 full-file peak가 0dBFS보다 낮아 분석상 디지털 clipping 증거는 없습니다. `cake-place-wood`와 `candle-light`에는 비교적 높은 순간 peak가 있으므로 최종 청취에서 날카로움과 다른 효과음과의 균형을 확인해야 합니다.

### 검출된 유효 구간

- Cake placement: 약 `524–791`, `2795–2959`, `5263–5538`, `7798–8011`, `10091–10349`, `12477–12748`, `14633–14912`, `16707–16945`, `21129–21497`, `22805–23017`, `24596–24869`, `26370–26621`, `28282–28496`, `31955–32125`, `33700–34017`, `35433–35648ms` 등 다수의 분리된 후보가 있습니다.
- Cake hit: 약 `52–131ms`가 유효 신호이며, 짧은 단일 one-shot입니다.
- Candle light: 약 `1091–1302ms`, `2414–2465ms`, `2684–2941ms` 부근의 묶음, `5703–5843ms`가 검출됐습니다.
- Candle blowout: 약 `622–1103ms`, `1155–2222ms`, `4366–5550ms`, `6949–8342ms`, `9632–10568ms`에 긴 후보가 있습니다.

여러 후보가 있다는 사실만 파형으로 확인했으며, 각각이 실제로 케이크 배치·점화·호흡 소리에 적합한지는 확정하지 않았습니다.

## Manifest marker와 volume

| Key / Event | Runtime | Marker | Marker mean / max | Volume | Cooldown / instances | Category / loop / once |
| --- | --- | --- | --- | ---: | --- | --- |
| `cake-place-wood-01` / `CAKE_PLACED` | `/assets/audio/edited/cake-place-wood-01.mp3` | `500 + 350ms` | -33.9 / -9.5dB | 0.58 | 300ms / 1 | sfx / No / No |
| `cake-hit-01` / `CAT_HIT_CAKE` | `/assets/audio/edited/cake-hit-01.mp3` | `0 + 130ms` | -30.4 / -12.3dB | 1.00 | 400ms / 1 | sfx / No / No |
| `candle-light-01` / `CANDLE_LIGHTING_STARTED` | `/assets/audio/edited/candle-light-01.mp3` | `2650 + 350ms` | -44.5 / -15.8dB | 0.78 | 300ms / 1 | sfx / No / No |
| `candle-blowout-01` / `CANDLE_BLOWN_OUT(airflow)` | `/assets/audio/edited/candle-blowout-01.mp3` | `7000 + 1300ms` | -39.4 / -25.9dB | 1.00 | 300ms / 1 | sfx / No / No |

`oncePerStage`는 모두 `false`입니다. 실제 사건마다 재생하되 cooldown과 `maxInstances: 1`로 빠른 중복을 막습니다. 최종 gain은 `master × category × asset volume`을 0–1로 제한하며 원본에는 정규화나 다른 파괴적 처리를 적용하지 않았습니다.

### 대체 후보

- Cake placement: `2750 + 300ms`(marker mean/max -39.4/-15.2dB), `5220 + 360ms`(-29.1/-3.3dB). 후자는 peak가 커서 volume을 별도로 낮춰야 할 수 있습니다.
- Candle light: `1060 + 300ms`(-30.4/-4.7dB), `5680 + 220ms`(-37.4/-18.8dB). 첫 후보가 현재 선택보다 훨씬 크므로 단순 marker 교체 시 같은 volume을 그대로 쓰지 않습니다.
- Candle blowout: `9630 + 1000ms`(-34.5/-18.8dB). 현재 7초 후보보다 레벨이 높습니다.
- Cake hit: 파일 전체가 130.600ms이므로 `0 + 130ms`만 사용합니다. MP3 padding을 포함하며 파일 범위를 넘지 않습니다.

위 대체 후보는 분석 이력과 향후 비교를 위해 남깁니다. 현재 marker의 시작·종료 경계, 앞 무음 체감과 의미 적합성은 프로젝트 소유자의 Audio QA 청취 검수를 통과했습니다.

## 재생 정책

- 유효한 `cake-desk` 배치의 `CAKE_PLACED`에서만 placement를 재생합니다. invalid drop과 reset에서는 재생하지 않습니다.
- `CAT_HIT_CAKE` 한 번에만 hit를 재생하며 `CAKE_DAMAGED`에는 중복 매핑하지 않습니다.
- 승인된 점화의 `CANDLE_LIGHTING_STARTED`에서 light를 재생합니다. 거부된 Command와 이미 lit인 촛불에는 재생하지 않습니다.
- blowout은 `CANDLE_BLOWN_OUT(reason: airflow)`에서만 재생합니다. `reason: movement`는 호흡/바람 음색이 어색할 가능성을 피하기 위해 소리를 생략합니다. Core 상태와 이벤트는 변경하지 않습니다.
- MP3 fetch/decode/playback 실패는 Core의 `lighting → lit` 전이에 영향을 주지 않습니다.

## 재사용 사운드

`CAT_NOTICED_CAKE` → `cat-chirp-01`, 준비 → `step-wood-01`, 착지 → `cat-landing`, 장난감 → `cat-toy-01`, 간식 → `cat-eating-01`, powered fan → `fan-loop-01`, 잘못된 drop → `error-pop-01`, 성공 → `success-01`을 기존 Stage 1·2 marker/volume 변경 없이 재사용합니다.

fan/고양이 loop는 stop, 장난감 종료, 성공, mute, reset, Stage 전환, Scene shutdown과 Bridge destroy에서 정리됩니다. Stage 3 reset 및 AudioContext unlock 뒤 powered fan snapshot을 재평가합니다.

## Audio QA

개발 서버의 `?stage=003&audioDebug=1`에서 key, 원본 파일명, 전체 길이, marker, volume, category, loop, Play/Stop, load 상태, decode 상태와 현재 재생 여부를 확인합니다. Play는 현재 marker만 재생합니다.

사람이 직접 확인한 항목:

- placement가 접시/케이크를 나무에 놓는 질감인지
- cake hit이 cat landing에 묻히지 않는지
- candle light 선택 후보에 불필요한 앞 무음이나 click이 없는지
- blowout이 짧은 pop이 아니라 촛불을 끄는 호흡/공기 소리인지
- light와 blowout이 powered fan loop 위에서도 들리는지
- smoke, damage overlay, flame 출현과 소리 onset이 자연스럽게 맞는지
- 대체 후보와 비교했을 때 현재 marker가 더 적절한지

위 항목은 프로젝트 소유자의 게임 내 청취 검수를 통과했습니다. 자동 검증은 파일·decode·이벤트 연결을 확인하며, 청취 승인 자체를 대체하지 않습니다.

## 출처와 라이선스

- Original URL: TODO: source metadata required
- Creator: TODO: source metadata required
- License: TODO: source metadata required
- Attribution required: TODO: source metadata required

제공자가 명시되지 않았으므로 Pixabay 등으로 추측하지 않습니다.

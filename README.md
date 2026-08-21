# Place & See

상황을 관찰하고 방해 변수를 제거해 목표를 완성하는 인과관계 기반 웹 퍼즐 게임입니다. 단순히 물건을
올바른 위치에 놓는 데서 끝나지 않고, 주변 사물과 캐릭터의 반응을 살펴 실패 원인을 해결하는 것이
핵심입니다.

> **현재 상태: Stage 1·2·3 vertical slices implemented**
>
> 프로젝트 전체가 완성된 것은 아니며, 세 스테이지의 플레이 흐름과 확장 가능한 구조를 검증한
> 세 Stage의 수직 샘플입니다.

## 현재 구현 상태

- 1600×900 가로형 Phaser 게임 화면과 React UI
- 실제 SVG 가구·소품과 파츠형 고양이 Rig
- 물병·간식·장난감 쥐·미끄럼 방지 매트 드래그 앤 드롭
- 프레임 속도와 독립적인 순수 TypeScript 결정적 Core 시뮬레이션
- 기본 실패 흐름, 세 가지 해결법, 3초 안정성 성공 판정
- 실패 후 재시도, 전체 Stage reset과 성공 화면
- 실제 MP3 효과음 18개, Sound On/Off와 안전한 loop 정리
- `?audioDebug=1`로 활성화하는 개발용 Audio QA 패널
- Core·Bridge·Audio 자동 테스트 및 1600×900 브라우저 플레이 검증 완료
- Stage 2 선풍기·서류 규칙, 플러그/문진/바람막이 해결법과 Stage 전환
- `?stage=002` 직접 진입과 Stage별 reset
- Stage 3 고양이+선풍기 복합 위협, 케이크/촛불/라이터와 네 가지 해결 조합
- Stage 1 → Stage 2 → Stage 3 순차 전환과 Stage 3 `Demo Complete`
- Stage 3 신규 SVG 6종과 신규 MP3 4종
- `?stage=002`, `?stage=003`, `?stage=003&audioDebug=1`, `?stage=003&debugZones=1` 개발용 진입
- Home, Stage Select, Stage Intro, Stage Complete, Demo Complete와 Credits로 이어지는 React 게임 셸
- 완료 Stage·마지막 선택 Stage·mute를 저장하는 `place-and-see:progress:v1` 진행 상태
- Start Stage 이후에만 Phaser/runtime을 내려받는 지연 로딩과 접근 가능한 loading/error/retry 화면

## Stage 1

**미션: 책상 위에 물병을 안전하게 두세요.**

책상 옆 고양이는 아무런 준비 없이 놓인 물병을 발견하면 책상으로 이동해 물병을 건드립니다. 물병이
넘어지면 물이 쏟아지지만 Stage는 자동으로 초기화되지 않으므로, 플레이어는 실패 원인을 관찰하고 다시
시도할 수 있습니다.

<details>
<summary>Stage 1 해결 방법 보기</summary>

- 간식을 바닥에 놓아 고양이의 관심을 돌립니다.
- 장난감 쥐로 고양이의 주의를 5초 동안 분산시킵니다.
- 미끄럼 방지 매트를 책상에 먼저 놓아 물병을 안정시킵니다.

</details>

상세 규칙은 [Stage 1 퍼즐 규칙](docs/PUZZLE_RULES.md)을 참고하세요.

## Stage 2

**미션: 책상 위에 서류를 안전하게 두세요.**

회전하는 선풍기가 책상을 향하면 보호되지 않은 서류가 흔들리다 바닥으로 날아갑니다. 날아간 서류는
자동 reset되지 않으며 다시 집어 시도할 수 있습니다.

<details>
<summary>Stage 2 해결 방법 보기</summary>

- 플러그를 뽑고 선풍기가 완전히 멈출 때까지 기다립니다.
- Stage 1의 물병을 서류 위에 문진으로 놓습니다.
- 파일꽂이를 선풍기와 서류 사이의 바람막이 zone에 놓습니다.

</details>

상세 규칙은 [Stage 2 퍼즐 규칙](docs/STAGE_002_RULES.md)을 참고하세요. 개발 중에는 `?stage=002`로
직접 진입할 수 있습니다.

## Stage 3

**미션: 촛불을 켠 케이크를 책상 위에 준비하세요.**

고양이와 선풍기가 동시에 등장합니다. 간식/장난감과 플러그/파일꽂이를 조합해 두 위협을 처리하고,
책상 위 케이크의 촛불을 켜 3초 동안 유지합니다. 상세 규칙은 [Stage 3 퍼즐 규칙](docs/STAGE_003_RULES.md),
오디오 상태는 [Stage 3 오디오 문서](docs/audio/STAGE_003_AUDIO.md)를 참고하세요.

## 조작 방법

- 마우스 또는 트랙패드로 상호작용 오브젝트를 드래그합니다.
- 강조되는 유효 영역에 오브젝트를 놓습니다. 유효하지 않은 위치에서는 원래 자리로 돌아갑니다.
- `처음부터 다시` 버튼으로 물웅덩이와 진행 상태를 포함한 Stage 전체를 초기화합니다.
- `Sound On` / `Sound Off` 버튼으로 전체 사운드를 음소거하거나 다시 켭니다.
- 개발 서버 URL에 `?audioDebug=1`을 붙이면 marker, volume, loop와 재생 상태를 확인할 수 있습니다.

셸 화면은 키보드로 조작할 수 있지만, 퍼즐 drag의 키보드 대체 조작과 모바일 세로 모드는 아직 지원하지 않습니다.

셸의 Play는 가장 이른 미완료 Stage의 Intro로 이동합니다. 각 Intro에서 `Start Stage`를 누르면 같은 사용자
입력 안에서 오디오 unlock을 시작한 뒤 game runtime을 동적으로 불러오며, 준비가 끝난 뒤에만
Core·GameBridge·Phaser session과 canvas가 만들어집니다. 전체 화면 흐름과 저장 정책은
[게임 셸 문서](docs/GAME_SHELL.md), bundle 측정과 지연 로딩 경계는 [성능 문서](docs/PERFORMANCE.md)를 참고하세요.

## 기술 스택

- React 19
- TypeScript 5.9 strict mode
- Phaser 3.90
- Vite 7
- Vitest 3.2
- ESLint 9와 CSS
- Web Audio API 기반 재생 backend

## 아키텍처

```text
React / Phaser
      ↓
  GameBridge
      ↓
 Core Command
      ↓
Game Event / Snapshot
      ↓
  GameBridge
      ↓
React / Phaser / AudioManager
```

- **Core**: 월드 상태, 명령, 규칙, 고양이 상태 머신과 안정성 판정을 소유합니다.
- **Stage 데이터**: 오브젝트·가구 배치, zone, 목표와 활성 Rule을 선언합니다.
- **Phaser**: SVG 렌더링, 드래그 입력, Rig와 Core Event 기반 Tween을 담당합니다.
- **React**: 미션, 상태 메시지, 안정성 진행률, reset, mute와 성공 UI를 담당합니다.
- **GameBridge**: React·Phaser와 Core 사이에서 Command, Event와 읽기 전용 snapshot을 전달합니다.
- **AudioManager**: 의미 기반 Event를 Manifest의 marker와 연결하며, 재생 실패가 게임 규칙에 영향을 주지 않게 합니다.

자세한 내용은 [아키텍처 문서](docs/ARCHITECTURE.md)와
[프로젝트 구조 문서](docs/PROJECT_STRUCTURE.md)를 참고하세요.

## 설치와 실행

Vite 7의 실행 조건에 맞는 Node.js 20.19 이상 또는 22.12 이상과 npm이 필요합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드와 로컬 미리보기:

```bash
npm run build
npx vite preview
```

## 검증

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run validate:stages
npm run validate:assets
npm run validate:audio
```

현재 자동 테스트 208개가 통과합니다. App flow, progress storage, query, lazy runtime과 session lifecycle 테스트를 포함하며 Stage 3는 Core/Phaser/Audio 자동 테스트와 SVG·MP3 원본/런타임 hash 검증을 유지합니다. Stage validator는 3개 Stage, asset validator는 Stage 2·3 SVG 원본/런타임 쌍, audio validator는 Stage 1 MP3 11개·Stage 2 MP3 3개·Stage 3 MP3 4개를 검증합니다. Stage 3 신규 MP3 4개의 marker, volume과 게임 내 재생은 프로젝트 소유자의 직접 청취 검수를 통과했습니다. 기존 Stage 1·2 MP3와 marker는 변경하지 않았습니다.

Stage 2의 `fan-loop-01.mp3`, `paper-flutter-01.mp3`, `paper-fall-01.mp3`는 파형 분석 기반 marker로
연결되었으며, 프로젝트 소유자의 직접 플레이 청취 검수를 통과했습니다. 자세한 값은
[Stage 2 오디오 문서](docs/audio/STAGE_002_AUDIO.md)에 기록되어 있습니다.

초기 entry에서는 Phaser가 제거됐으며 Phaser를 포함한 lazy runtime chunk의 500kB 초과 Vite 경고만
남아 있습니다. 경고 제한값은 높이지 않았고 세부 수치는 [성능 문서](docs/PERFORMANCE.md)에 기록했습니다.

## 프로젝트 구조

```text
src/
├── app/          # React 화면과 전역 스타일
├── audio/        # AudioManager, Manifest와 Event mapping
├── bridge/       # React–Phaser–Core 통신
├── content/      # Stage 데이터와 schema
├── core/         # 엔진, 규칙, 상태, Command와 Event
├── game-runtime/ # 지연 로드되는 Bridge/Core/Audio/Phaser session 조립
├── phaser/       # Scene, View, Rig, layout과 Asset loading
└── ui/           # React UI 컴포넌트

public/assets/
├── audio/edited/ # 게임이 로드하는 런타임 MP3
├── characters/   # 고양이 파츠 SVG와 Rig
├── furniture/    # 가구 SVG
└── props/        # 상호작용 소품 SVG

source-assets/
├── audio/raw/    # 보존용 원본 MP3
└── svg/          # 편집 가능한 원본 SVG와 Rig
```

## 에셋과 라이선스

그래픽은 이 프로젝트를 위해 작성한 편집 가능한 순수 SVG/XML 에셋입니다. 원본은 `source-assets/svg`,
Phaser 런타임 복제본은 `public/assets`에서 관리합니다.

Stage 1 효과음은 Pixabay Sound Effects에서 확보했으며 Pixabay Content License가 적용됩니다. 출처 표기는
필수가 아니지만 프로젝트 내부 provenance 문서에서 관리합니다. 효과음은 게임에 포함하여 사용하고,
원본 또는 실질적으로 동일한 사운드를 독립적인 에셋 팩으로 재배포하지 않습니다. 개별 에셋 URL과
제작자 정보는 제공된 기록이 없어 추측하지 않습니다.

- [Pixabay Sound Effects](https://pixabay.com/sound-effects/)
- [Pixabay Content License](https://pixabay.com/service/license-summary/)
- [Pixabay FAQ](https://pixabay.com/service/faq/)
- [Stage 1 사운드 출처와 청취 검수](docs/audio/STAGE_001_AUDIO.md)

> Selected sound effects sourced from Pixabay.

## AI 활용

OpenAI Game Builders 제출 프로젝트로서 AI를 게임 아이디어와 퍼즐 구조 구체화, 프로젝트·문서 설계,
React·Phaser·Core와 테스트 구현 보조, SVG 제작 지시와 검증, 사운드 Manifest 연결, 자동 테스트·브라우저
검증 및 반복적인 시각 품질 보정에 활용했습니다.

기획 결정, 에셋 선택, 실제 사운드 청취 검수와 최종 품질 판단은 프로젝트 소유자가 수행했습니다. 작업별
기록은 [AI 사용 기록](docs/AI_USAGE_LOG.md)에 남깁니다.

### Stage 3 복합 퍼즐

Codex를 활용해 고양이와 선풍기를 결합한 복합 퍼즐의 상태 구조, 케이크·촛불 SVG, 결정적 Core 규칙,
Audio Manifest와 자동 테스트를 구현했습니다. 실제 플레이 중 사용자가 발견한 촛불 점화 문제는 동적 world
bounds와 전용 `LIGHT_CANDLE` Command로 수정했습니다. 사운드 선택과 최종 청취, 퍼즐 난이도와 시각 품질
판단은 프로젝트 소유자가 직접 수행했습니다. 자세한 과정과 역할 구분은 [AI 사용 기록](docs/AI_USAGE_LOG.md)에
정리되어 있습니다.

## 다음 단계

1. 사람 플레이테스트로 조작 이해도와 퍼즐 해답의 발견 가능성 검증
2. hit area와 고양이·물병의 코미디 타이밍 보정
3. Stage 4는 아직 구현되지 않았으며, 후속 범위에서 별도로 설계
4. 추가 최적화가 필요하면 Stage별 Scene/Asset preload 분리와 Phaser lazy chunk 내부 분석 검토

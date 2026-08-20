# Place & See

상황을 관찰하고 방해 변수를 제거해 목표를 완성하는 인과관계 기반 웹 퍼즐 게임입니다. 단순히 물건을
올바른 위치에 놓는 데서 끝나지 않고, 주변 사물과 캐릭터의 반응을 살펴 실패 원인을 해결하는 것이
핵심입니다.

> **현재 상태: Stage 1 vertical slice completed**
>
> 프로젝트 전체가 완성된 것은 아니며, 첫 번째 스테이지의 플레이 흐름과 확장 가능한 구조를 검증한
> 체크포인트입니다.

## 현재 구현 상태

- 1600×900 가로형 Phaser 게임 화면과 React UI
- 실제 SVG 가구·소품과 파츠형 고양이 Rig
- 물병·간식·장난감 쥐·미끄럼 방지 매트 드래그 앤 드롭
- 프레임 속도와 독립적인 순수 TypeScript 결정적 Core 시뮬레이션
- 기본 실패 흐름, 세 가지 해결법, 3초 안정성 성공 판정
- 실패 후 재시도, 전체 Stage reset과 성공 화면
- 실제 MP3 효과음 11개, Sound On/Off와 안전한 loop 정리
- `?audioDebug=1`로 활성화하는 개발용 Audio QA 패널
- Core·Bridge·Audio 자동 테스트 및 1600×900 브라우저 플레이 검증 완료

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

## 조작 방법

- 마우스 또는 트랙패드로 상호작용 오브젝트를 드래그합니다.
- 강조되는 유효 영역에 오브젝트를 놓습니다. 유효하지 않은 위치에서는 원래 자리로 돌아갑니다.
- `처음부터 다시` 버튼으로 물웅덩이와 진행 상태를 포함한 Stage 전체를 초기화합니다.
- `Sound On` / `Sound Off` 버튼으로 전체 사운드를 음소거하거나 다시 켭니다.
- 개발 서버 URL에 `?audioDebug=1`을 붙이면 marker, volume, loop와 재생 상태를 확인할 수 있습니다.

키보드 전용 조작과 모바일 세로 모드는 아직 지원하지 않습니다.

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

현재 체크포인트 기준으로 테스트 46개, Stage 1 데이터 검증, SVG 에셋 구조 검증, Audio Manifest와
런타임 MP3 11개 검증이 통과했습니다. 브라우저에서는 단일 1600×900 캔버스, 세 해결법, reset,
사운드 수명주기와 콘솔 warning/error 및 에셋 404 부재를 확인했습니다.

Phaser를 포함한 단일 프로덕션 번들이 500kB를 넘는 Vite 경고는 현재 알려진 비차단 항목입니다.

## 프로젝트 구조

```text
src/
├── app/          # React 화면과 전역 스타일
├── audio/        # AudioManager, Manifest와 Event mapping
├── bridge/       # React–Phaser–Core 통신
├── content/      # Stage 데이터와 schema
├── core/         # 엔진, 규칙, 상태, Command와 Event
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

## 다음 단계

1. 사람 플레이테스트로 조작 이해도와 퍼즐 해답의 발견 가능성 검증
2. hit area와 고양이·물병의 코미디 타이밍 보정
3. Stage 2 설계와 데이터 기반 콘텐츠 확장
4. 필요할 경우 Phaser 번들 분할과 초기 로딩 개선

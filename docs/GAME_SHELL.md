# Place & See 게임 셸

## App flow

React가 다음 화면 상태와 현재 Stage 선택을 소유합니다.

```text
home
→ stage-select 또는 stage-intro
→ stage-loading
→ playing
→ stage-complete
→ 다음 stage-intro
→ stage-loading
→ playing
→ demo-complete
```

`stage-load-error`는 runtime import 또는 session 생성·mount 실패 시 표시되고 같은 Stage Retry, Stage Select와 Home을 제공합니다. 브라우저가 실패한 module URL을 현재 문서에서 재사용하지 않을 수 있으므로 import 실패 Retry는 같은 Stage query로 문서를 새로 로드하고, session 생성 실패는 SPA 안에서 재시도합니다. `credits`는 Home과 Demo Complete에서 진입할 수 있습니다. `AppFlowState`는 `screen`, `selectedStageId`, `completedStageIds`, `lastPlayedStageId`만 보유하며 퍼즐 중간 snapshot은 저장하지 않습니다.

## 화면

- Home: 제목, 소개, Play, Stage Select, Credits와 Sound toggle을 표시합니다.
- Stage Select: 세 Stage를 잠금 없이 표시하고 완료된 Stage에는 `✓ Completed`와 Replay를 표시합니다.
- Stage Intro: Stage 미션과 Start Stage를 표시합니다. 이 화면에는 Phaser canvas와 Core session이 없습니다.
- Stage Loading: runtime과 session이 준비되는 동안 `Loading Stage…` 상태를 표시하며 중복 Start 입력을 막습니다. 준비 전에는 canvas가 없습니다.
- Stage Load Error: 내부 오류 정보 없이 실패를 알리고 Retry, Stage Select와 Back to Title을 제공합니다.
- Playing: 기존 React–Phaser–GameBridge–Core 흐름을 유지합니다.
- Stage Complete: Stage 1·2 완료 후 Next Stage, Replay와 Stage Select를 제공합니다.
- Demo Complete: Stage 3 완료 후 canvas를 제거하고 Replay from Stage 1, Stage Select, Credits와 Back to Title을 제공합니다.
- Credits: 제작, AI 활용, 그래픽, 사운드와 기술 정보를 표시합니다.

## Stage session lifecycle

`GameSessionManager`가 pending load와 활성 session을 한 곳에서 소유합니다. Start Stage에서 오디오 준비를 시작한 뒤 `loadGameRuntime()`의 단일 cached dynamic import로 runtime을 불러오고, session 생성이 성공해야 `playing`으로 전환합니다. `playing`일 때만 Phaser를 mount합니다. Home, Stage Select, Replay, 다음 Stage, Stage 완료, Demo Complete와 React unmount에서는 fan·고양이·paper loop를 정지하고 Bridge와 Phaser game을 해제합니다.

취소할 수 없는 `import()`에는 request generation을 사용합니다. 화면 이동·unmount 뒤 완료된 load는 session을 만들지 않으며, session 생성 중 stale이 되면 결과를 즉시 destroy합니다. React 개발 모드 effect 재실행도 generation guard로 보호하고 `PhaserGame.mount()`는 중복 mount를 거부합니다. 활성 session, canvas와 runtime 소유자는 각각 최대 하나입니다.

## Audio unlock

일반 흐름에서는 Start Stage 클릭 handler가 경량 Web Audio backend의 context 생성/resume을 같은 사용자 gesture 안에서 시작한 다음 runtime dynamic import를 호출합니다. lazy runtime은 준비된 backend를 Stage AudioManager에 넘기고, unlock 결과와 현재 snapshot을 다시 동기화해 Stage 2·3 powered fan loop를 시작합니다. unlock 실패·fetch·decode 오류는 runtime load, session 시작과 Core 전이를 막지 않습니다.

개발 query 직접 진입은 Intro를 생략하고 loading을 거쳐 session을 만듭니다. 이 경우 첫 pointer, click, touch 또는 keyboard 입력의 capture 경로에서 unlock하고 현재 snapshot을 다시 동기화합니다. mute 상태에서는 unlock되더라도 실제 출력과 행동 loop가 정지 상태로 유지됩니다.

## 진행 저장

저장 key는 `place-and-see:progress:v1`입니다.

```ts
type StoredGameProgressV1 = {
  version: 1;
  completedStageIds: string[];
  lastPlayedStageId: string | null;
  muted: boolean;
};
```

Stage 선택, Stage 완료와 mute 변경 후 저장합니다. JSON parse 실패, 다른 version, 알 수 없는 Stage ID, 중복 ID와 localStorage 접근 실패는 안전하게 정리하거나 기본값으로 복구합니다. 기존 `place-and-see.audio-muted` 값은 v1 데이터가 아직 없을 때 mute 초기값으로 읽고, 저장 시 호환 mirror를 갱신합니다.

Reset Progress는 Stage Select와 Credits에서 확인 대화상자를 거친 뒤 completed Stage와 last played 정보만 초기화합니다. 사용자 사운드 설정은 유지합니다. 퍼즐의 Restart Stage는 현재 Core session만 reset하며 저장 진행률을 지우지 않습니다.

## Query 정책

- `?stage=001`, `?stage=002`, `?stage=003`: 해당 Stage를 Intro 없이 lazy loading 후 직접 시작합니다.
- `?stage=003&audioDebug=1`: Stage 3 Audio QA를 유지합니다.
- `?stage=003&debugZones=1`: candle/drop debug bounds를 유지합니다.
- 알 수 없는 Stage ID: canvas를 만들지 않고 Home으로 이동합니다.

## 접근성 및 반응형

셸 조작은 의미 있는 native button과 link를 사용해 Tab, Enter와 Space 입력을 지원합니다. Sound toggle에는 상태별 `aria-label`과 `aria-pressed`, 화면마다 단일 주 heading, Stage 완료에는 색상과 함께 텍스트 표시가 있습니다. 외부 링크는 `target="_blank" rel="noreferrer"`를 사용합니다.

Stage 카드는 작은 화면에서 단일 열로 바뀌며 Credits는 세로 스크롤됩니다. 셸과 loading/error panel은 1600×900, 1000×700, 800×600과 640×360에서 가로 스크롤 없이 동작합니다. 퍼즐 canvas의 논리 해상도 1600×900과 Phaser FIT 정책은 변경하지 않았습니다. `prefers-reduced-motion`에서는 셸 transition과 loading indicator animation 시간을 최소화합니다.

# Place & See 게임 셸

## App flow

React가 다음 화면 상태와 현재 Stage 선택을 소유합니다.

```text
home
→ stage-select 또는 stage-intro
→ playing
→ stage-complete
→ 다음 stage-intro
→ playing
→ demo-complete
```

`credits`는 Home과 Demo Complete에서 진입할 수 있습니다. `AppFlowState`는 `screen`, `selectedStageId`, `completedStageIds`, `lastPlayedStageId`만 보유하며 퍼즐 중간 snapshot은 저장하지 않습니다.

## 화면

- Home: 제목, 소개, Play, Stage Select, Credits와 Sound toggle을 표시합니다.
- Stage Select: 세 Stage를 잠금 없이 표시하고 완료된 Stage에는 `✓ Completed`와 Replay를 표시합니다.
- Stage Intro: Stage 미션과 Start Stage를 표시합니다. 이 화면에는 Phaser canvas와 Core session이 없습니다.
- Playing: 기존 React–Phaser–GameBridge–Core 흐름을 유지합니다.
- Stage Complete: Stage 1·2 완료 후 Next Stage, Replay와 Stage Select를 제공합니다.
- Demo Complete: Stage 3 완료 후 canvas를 제거하고 Replay from Stage 1, Stage Select, Credits와 Back to Title을 제공합니다.
- Credits: 제작, AI 활용, 그래픽, 사운드와 기술 정보를 표시합니다.

## Stage session lifecycle

`GameSessionManager`가 활성 Bridge를 하나만 소유합니다. Start Stage에서 session을 만들고 `playing`일 때만 Phaser를 mount합니다. Home, Stage Select, Replay, 다음 Stage, Stage 완료, Demo Complete와 React unmount에서는 fan·고양이·paper loop를 정지하고 Bridge와 Phaser game을 해제합니다.

React 개발 모드의 effect 재실행에서는 generation guard를 사용해 살아 있는 Bridge를 잘못 destroy하지 않습니다. `PhaserGame.mount()`도 같은 wrapper에서 중복 mount를 거부하므로 canvas는 최대 한 개입니다.

## Audio unlock

일반 흐름에서는 Start Stage 클릭 handler가 Stage용 AudioManager와 Bridge를 만들고 같은 사용자 gesture 안에서 `unlockAudio()`를 호출한 뒤 session을 mount합니다. unlock이 성공하면 현재 snapshot을 재평가해 Stage 2·3 powered fan loop를 시작합니다. 실패·fetch·decode 오류는 session 시작과 Core 전이를 막지 않습니다.

개발 query 직접 진입은 Intro를 생략합니다. 이 경우 기존 호환 정책대로 첫 pointer, touch 또는 keyboard 입력에서 unlock하고 현재 snapshot을 다시 동기화합니다. mute 상태에서는 unlock되더라도 실제 출력과 행동 loop가 정지 상태로 유지됩니다.

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

- `?stage=002`, `?stage=003`: 해당 Stage를 Intro 없이 직접 시작합니다.
- `?stage=003&audioDebug=1`: Stage 3 Audio QA를 유지합니다.
- `?stage=003&debugZones=1`: candle/drop debug bounds를 유지합니다.
- 알 수 없는 Stage ID: canvas를 만들지 않고 Home으로 이동합니다.

## 접근성 및 반응형

셸 조작은 의미 있는 native button과 link를 사용해 Tab, Enter와 Space 입력을 지원합니다. Sound toggle에는 상태별 `aria-label`과 `aria-pressed`, 화면마다 단일 주 heading, Stage 완료에는 색상과 함께 텍스트 표시가 있습니다. 외부 링크는 `target="_blank" rel="noreferrer"`를 사용합니다.

Stage 카드는 작은 화면에서 단일 열로 바뀌며 Credits는 세로 스크롤됩니다. 셸은 1600×900, 1000×700, 800×600과 640×360에서 가로 스크롤 없이 동작합니다. 퍼즐 canvas의 논리 해상도 1600×900과 Phaser FIT 정책은 변경하지 않았습니다. `prefers-reduced-motion`에서는 셸 transition 시간을 최소화합니다.

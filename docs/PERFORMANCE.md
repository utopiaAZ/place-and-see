# 초기 로딩과 game runtime

## 지연 로딩 경계

초기 entry는 React 게임 셸, 화면, 진행 저장, query parser와 Web Audio 준비 계층만 포함합니다. `loadGameRuntime()`이 `src/game-runtime/GameRuntime.ts`를 한 번 동적 import하며, 이 경계 뒤에서 Stage 데이터, GameBridge/Core, Audio Manifest, Phaser game config, Scene/View/animation과 Asset Manifest를 조립합니다. 성공한 module promise는 Stage 전환에서도 재사용됩니다. import가 실패하면 cache를 비워 Retry가 다시 요청할 수 있습니다.

```text
Start Stage gesture
→ Web Audio context 생성/resume 시작
→ stage-loading
→ GameRuntime dynamic import
→ Bridge/Core/Audio/Phaser session 생성
→ playing
→ canvas mount
```

Stage Intro만 열거나 Home, Stage Select와 Credits를 둘러볼 때는 runtime import와 canvas 생성이 발생하지 않습니다.

## GitHub Pages base

production build의 기본 base는 Project Pages 경로 `/place-and-see/`입니다. 개발 서버는 기존대로 `/`를 사용합니다. GitHub Actions에서는 `actions/configure-pages`가 반환한 `base_path`를 `VITE_BASE_PATH`로 전달하고, 공통 `publicAssetUrl()` helper가 SVG, MP3와 JSON URL에 `import.meta.env.BASE_URL`을 한 번만 적용합니다. Phaser lazy chunk는 Vite가 같은 base 아래에서 생성합니다.

하위 경로 build에서는 entry와 lazy chunk가 각각 `/place-and-see/assets/...`를 사용하며 Home 초기 HTML은 lazy chunk를 preload하지 않습니다. runtime 에셋도 같은 prefix를 사용하고 root `/assets/...` 또는 base 중복 URL을 만들지 않습니다.

## Production bundle 비교

2026-08-21에 동일한 `npm run build`의 Vite `computing gzip size` 출력으로 minified JS raw/gzip 크기를 측정했습니다. CSS와 HTML은 표에서 제외했습니다.

| 항목 | 변경 전 raw / gzip | 변경 후 raw / gzip |
| --- | ---: | ---: |
| 초기 entry 관련 JS | 1,535.63 / 423.64kB | 220.16 / 68.72kB |
| Phaser lazy chunk | 해당 없음 | 1,317.81 / 355.52kB |
| 전체 JS | 1,535.63 / 423.64kB | 1,537.97 / 424.24kB |

목표는 전체 Phaser 크기를 숨기는 것이 아니라 초기 셸 경로에서 다운로드와 평가를 미루는 것입니다. Phaser lazy chunk의 500kB 초과 경고는 남아 있으며 `chunkSizeWarningLimit`은 변경하지 않았습니다.

## Loading, 실패와 lifecycle

`stage-loading`은 중복 Start를 막고 accessible status를 표시합니다. import/session/mount 실패는 사용자에게 stack trace를 노출하지 않는 `stage-load-error`로 이동하며 Retry는 같은 Stage를 다시 시도합니다. 실패한 module URL의 브라우저 cache 영향을 피하기 위해 import 실패는 같은 Stage query로 문서를 새로 로드하고, session 생성 실패는 cached runtime으로 SPA 재시도합니다. 개발 환경에서만 안전한 console error로 원인을 남깁니다.

`GameSessionManager`는 generation token으로 늦은 import 결과를 무효화합니다. 취소 뒤에는 prepared audio를 정리하고, 생성 중이던 session이 늦게 반환되면 즉시 destroy합니다. 불변식은 활성 GameSession ≤ 1, Phaser canvas ≤ 1, 활성 Stage runtime 소유자 ≤ 1입니다.

## Audio unlock

Web Audio backend는 초기 bundle에서 사용할 수 있지만 Stage Manifest와 AudioManager는 runtime 경계 뒤에 있습니다. Start Stage gesture 안에서 context 생성/resume을 먼저 시작하고, runtime 준비 후 같은 backend를 AudioManager에 전달해 snapshot 기반 loop를 재평가합니다. direct query는 첫 pointer/click/touch/keyboard 입력에서 같은 동기화를 수행합니다. unlock 실패는 Stage 시작을 막지 않습니다.

## 후속 후보

초기 entry는 충분히 분리됐습니다. 추가 최적화가 필요해지면 Stage별 Scene/Asset preload 분리와 Phaser lazy chunk 내부 분석을 별도 작업으로 검토할 수 있습니다. 현재 작업에서는 manualChunks, 의존성 추가나 경고 제한 상향을 사용하지 않았습니다.

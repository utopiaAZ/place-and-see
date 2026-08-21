# GitHub Pages 배포

## 배포 대상

- 상태: 배포 완료
- GitHub 저장소: `utopiaAZ/place-and-see`
- Pages 유형: Project Pages
- Live URL: `https://utopiaaz.github.io/place-and-see/`
- production base: `/place-and-see/`
- 배포 기준 commit: `bb5475e2b8dfbbcef12bcb30735a2c5275cb473e`
- commit message: `ci: add GitHub Pages deployment`
- 최초 성공 Actions run: [#32444074224](https://github.com/utopiaAZ/place-and-see/actions/runs/32444074224)

GitHub Actions의 build, test, validator, artifact upload와 deploy 단계가 모두 통과했으며 위 URL을 실제
GitHub Pages 배포본으로 확인했습니다. custom domain은 현재 범위 밖입니다.

## 최초 배포와 최종 QA

### 자동 검증

- GitHub Actions production build, TypeScript와 ESLint 통과
- 22개 테스트 파일의 220개 자동 테스트 통과
- Stage 3개, Stage 2·3 SVG 13쌍, Audio Stage별 11/3/4개 validator 통과
- Pages artifact upload와 `github-pages` deploy 성공

### 배포 smoke test

- Home, CSS와 favicon 응답 및 화면 표시 정상
- Home, Stage Select와 Stage Intro에서 canvas 0개, Stage 시작 후 Phaser lazy runtime과 canvas 1개 확인
- Stage query 직접 진입과 대표 SVG, `cat-rig.json`, MP3 요청 정상
- root `/assets/...` 또는 중복 `/place-and-see/place-and-see/...` 요청 없음
- 처리되지 않은 오류나 실패 화면 없음

GitHub Pages는 MP3를 `audio/mp3`로 제공했습니다. Web Audio loader의 `audio/*` 검사를 통과했고 실제
재생도 정상이므로 수정이 필요하지 않습니다.

### 사용자 직접 검수

프로젝트 소유자가 배포본에서 Stage 1→Stage 2→Stage 3 전체 플레이를 완료해 각 Stage의 해결 흐름과
전환을 확인했습니다. 효과음과 반복 사운드를 직접 청취했으며, 사운드 품질·상대적 연출과 최종 플레이
경험에 차단 문제가 없음을 확인하고 배포본을 승인했습니다.

## Vite base와 runtime asset URL

개발 서버는 `/`를 사용하고 production build는 기본적으로 `/place-and-see/`를 사용합니다. workflow에서는 `actions/configure-pages`의 `base_path` 출력으로 `VITE_BASE_PATH`를 전달하므로 저장소 이름을 workflow에 중복 작성하지 않습니다. 값은 Vite config에서 leading/trailing slash가 하나씩 있도록 정규화됩니다.

`src/assets/publicAssetUrl.ts`는 `import.meta.env.BASE_URL`과 `public` 내부 상대 경로를 결합합니다. Stage 1·2·3 SVG, MP3, `cat-rig.json`과 Home 장식은 모두 이 helper를 사용합니다. 외부 HTTP(S), `data:`와 `blob:` URL은 보존하고 `..` 경로 순회는 거부합니다. Phaser lazy chunk URL은 Vite dynamic import가 production base를 자동 적용합니다.

## GitHub Actions workflow

`.github/workflows/deploy-pages.yml`은 `main` push와 수동 실행에서 다음 순서로 동작합니다.

```text
checkout → Node 22 → npm ci
→ typecheck → lint → test
→ Stage/Asset/Audio validation
→ configure Pages → production build
→ dist artifact upload → github-pages deploy
```

공식 GitHub Actions만 사용하며 `contents: read`, `pages: write`, `id-token: write` 권한을 선언합니다. 배포 job은 `github-pages` environment와 deployment output URL을 사용합니다. `dist`나 별도 `gh-pages` branch는 저장소에 commit하지 않습니다.

## 로컬 subpath preview

```bash
npm ci
npm run build
node scripts/serve-subpath-preview.mjs --base /place-and-see/ --port 4176
```

Vite preview는 build의 base URL을 HTML에 반영하지만 `dist`를 실제 하위 mount에 놓지는 않습니다. 위 검증용 정적 서버는 GitHub Pages처럼 `dist`를 지정한 base 아래에 mount합니다. 브라우저에서 `http://127.0.0.1:4176/place-and-see/`를 열고 다음 query도 확인합니다.

```text
/place-and-see/?stage=001
/place-and-see/?stage=002
/place-and-see/?stage=003
/place-and-see/?stage=003&audioDebug=1
/place-and-see/?stage=003&debugZones=1
```

다른 base를 점검할 때는 build 시 `VITE_BASE_PATH`를 지정합니다. PowerShell 예시는 다음과 같습니다.

```powershell
$env:VITE_BASE_PATH='/preview/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

## 최초 배포 시 완료한 GitHub 설정

1. Repository **Settings**를 엽니다.
2. **Pages**로 이동합니다.
3. **Build and deployment**의 **Source**를 **GitHub Actions**로 선택합니다.
4. `main` push 또는 Actions의 **Deploy GitHub Pages**에서 `workflow_dispatch`를 실행합니다.
5. build와 deploy job이 모두 성공했는지 확인하고 deployment URL을 엽니다.

저장소 소유자가 Pages Source를 **GitHub Actions**로 설정해 최초 배포를 완료했습니다. 이후에도 별도
secret이나 `gh-pages` branch 없이 같은 workflow로 재배포합니다.

## 향후 재배포 체크리스트

- Home, Stage Select, Credits와 Stage Intro에서 canvas가 0개인지 확인
- Start Stage 뒤 `GameRuntime` lazy chunk와 canvas 하나가 생성되는지 확인
- Stage 1→2→3, Replay, Home 복귀와 query 직접 진입 확인
- SVG, MP3와 `cat-rig.json` 응답이 200이며 MIME type이 올바른지 확인
- `/assets/...` root 요청이나 `/place-and-see/place-and-see/...` 중복 경로가 없는지 확인
- progress와 mute가 새로고침 후 복원되는지 확인
- console error, decode 오류와 asset 404가 없는지 확인

## Rollback

문제가 생기면 실패한 배포를 강제로 덮어쓰지 않습니다. 원인을 수정한 새 commit을 `main`에 추가하거나, GitHub Actions의 이전 성공 workflow를 다시 실행해 해당 artifact를 재배포합니다. 기존 commit amend, rebase, force push와 `gh-pages` branch 직접 수정은 사용하지 않습니다.

## 비차단 경고와 후속 범위

Phaser를 포함한 lazy chunk의 500kB 초과 Vite 경고는 남아 있습니다. 이는 초기 entry에서 분리되어 있으며 경고 제한값을 높이지 않았습니다. favicon은 기존 `bottle.svg`를 재사용하며 신규 그래픽을 만들지 않았습니다. 전용 favicon과 OG 이미지는 별도 디자인·메타데이터 작업으로 남깁니다.

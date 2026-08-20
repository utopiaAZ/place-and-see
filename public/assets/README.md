# Runtime assets

브라우저에서 직접 로드할 최적화된 에셋만 둡니다. 그래픽은 `characters/`, `props/`,
`furniture/`, `backgrounds/`, `effects/`에, 오디오는 의미별 하위 폴더에 둡니다.
키와 파일 경로의 연결 정보는 `manifests/`에서 관리합니다. 원본 작업 파일은 이곳에 두지 않습니다.

Stage 001의 검수된 SVG는 `furniture/`, `props/`, `characters/cat/`에 있습니다. 현재는 편집 원본과
동일하지만 이 경로가 Phaser 런타임 계약이며, 원본 수정은 `source-assets/svg/`에서 먼저 진행한 뒤
검증과 함께 동기화합니다.

# 그래픽 에셋 통합

## 저장 위치와 키

편집 가능한 SVG 원본은 `source-assets/svg`에, 최적화되어 브라우저가 읽는 SVG는
`public/assets/characters`, `props`, `furniture`, `backgrounds`, `effects`에 둡니다. Phaser 키는
`actor.cat.body`, `prop.bottle`, `furniture.desk`처럼 `<분류>.<대상>[.<파트>]`를 사용하고
`public/assets/manifests`에서 URL과 연결합니다. Stage에는 URL 대신 이 키만 기록합니다.

## 캐릭터 파츠

독립 Tween이 필요한 머리, 몸, 눈, 꼬리, 앞발은 별도 SVG 파츠로 export합니다. 공통 viewBox와
일관된 기준점/스케일을 사용하고 파일명에 상태를 중복 인코딩하지 않습니다. 단순 정적 캐릭터는
하나의 SVG로 시작해도 됩니다.

## 임시 View 교체

현재 `CatView`와 `BottleView` 내부의 Phaser Graphics 생성 코드만 `scene.add.image` 또는 파츠
Container 생성으로 교체합니다. public API(`setPosition`, `showInterest`, drag hit area)는 유지합니다.
`PreloadScene`에서 매니페스트를 읽고 논리 키로 SVG를 로드합니다. Scene이나 Core에 실제 파일명을
하드코딩하지 않습니다. 현재 도형은 최종 그래픽이 아니라 구조/입력 검증 전용입니다.

외부 이미지를 자동 다운로드하지 않으며, 모든 원본의 제작 기록과 라이선스/출처는
`docs/AI_USAGE_LOG.md` 또는 인접 메타데이터에 기록합니다.

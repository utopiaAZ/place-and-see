# 프로젝트 구조

## 현재 구조

```text
public/assets/                 런타임 그래픽·오디오·매니페스트
source-assets/                 편집 가능한 원본과 제작 기록
src/
  app/                         앱 조합과 전역 스타일
  audio/                       SoundEvent, 매니페스트, 재생 포트
  bridge/                      Core 통신 경계
  content/schema/              데이터 스키마
  content/stages/              스테이지 데이터
  core/commands/               Core 입력
  core/engine/                 상태 소유 및 시뮬레이션
  core/events/                 Core 출력
  core/goals/                  목표와 안정성 평가
  core/rules/                  인과 규칙
  core/types/                  공유 도메인 타입
  phaser/config/               Phaser 설정
  phaser/scenes/               부팅, 로딩, 방 Scene
  phaser/views/                교체 가능한 객체 View
  store/                       React용 읽기 전용 구독 훅
  ui/                          미션, 조작, 결과 UI
tests/{core,stages,integration}
scripts/                       콘텐츠/에셋 정적 검증
docs/                          설계 및 통합 문서
```

`phaser/animation`, `phaser/input`, `content/actors`, `content/objects`, `content/rules`, `save`,
`shared`, `ui/settings`는 실제 기능이 생길 때 만듭니다. 빈 추상화와 `.gitkeep`을 만들지 않았습니다.

## 새 파일 배치

- 퍼즐의 참/거짓 및 상태 변화: `src/core/rules` 또는 `src/core/goals`
- 새 Command/Event: 각 `src/core/commands`, `src/core/events`의 공용 유니온
- 스테이지별 값: `src/content/stages`; 재사용 정의가 생기면 content 하위 카탈로그
- Phaser 표현: `src/phaser/views`; Scene은 View 배치와 입력 변환만 담당
- React 표시: `src/ui`; 앱 조합은 `src/app`
- 최적화된 런타임 파일: `public/assets`; 제작 원본: `source-assets`

## 금지되는 의존 방향

Core에서 React, Phaser, DOM API, Content를 import하면 안 됩니다. Core가 정의한
`PuzzleStageDefinition`을 Content의 `StageDefinition`이 확장하므로 의존 방향은 `content → core`입니다.

`core → bridge`, `bridge → Phaser/React`, `content → Phaser/React`, `React → Phaser 내부`,
`Phaser → React 내부`도 금지합니다. UI와 Scene은 상태를 직접 변경하지 않고 Bridge Command를 씁니다.

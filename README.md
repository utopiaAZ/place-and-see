# Place & See

일상적인 미션을 수행하고 환경과 캐릭터의 반응을 관찰하는 코미디 인과관계 퍼즐 게임의
초기 프로젝트 골격입니다. 현재 예제 미션은 **“책상 위에 물병을 안전하게 두세요.”**입니다.

## 기술 스택

React, TypeScript(strict), Vite, Phaser, Vitest, ESLint와 CSS를 사용합니다. Core는 UI 및
렌더링 프레임워크에 의존하지 않는 순수 TypeScript입니다.

## 시작하기

Node.js 20.19 이상 또는 22.12 이상이 필요합니다.

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run validate:stages
npm run validate:assets
```

## 주요 폴더

- `src/core`: 상태, Command, Event, Rule, Goal과 시뮬레이션
- `src/content`: 프레임워크 객체를 포함하지 않는 스테이지 데이터
- `src/bridge`: React/Phaser와 Core 사이의 유일한 통신 경계
- `src/phaser`: 방 렌더링, 포인터 입력, Tween과 임시 도형 View
- `src/ui`, `src/app`: 미션, 안정성, 조작 버튼과 캔버스 마운트
- `src/audio`: 의미 기반 사운드 이벤트와 안전한 재생 포트
- `public/assets`: 브라우저 배포용 에셋(현재 최종 에셋 없음)
- `source-assets`: SVG/WAV 원본과 제작 기록
- `tests`: Core 우선 단위 및 Bridge 통합 테스트
- `docs`: 구조, 콘텐츠, 에셋 통합 설계 문서

## 현재 구현 범위

물병 도형을 드래그해 책상 배치 영역에 놓으면 Core의 위치가 변경되고 3초 안정성 타이머가
진행됩니다. 고양이는 관심 Event에 짧게 반응하지만 아직 물병을 쓰러뜨리지 않습니다. 화면의
모든 도형은 아키텍처와 입력 검증용 임시 표시이며 최종 그래픽이 아닙니다. 재시작은 스테이지를
초기 데이터에서 새로 생성합니다. 오디오 파일이 없어도 실행됩니다.

## 다음 작업

1. Core에 지연 행동 스케줄러와 고양이 접근/물병 낙하 규칙 추가
2. Command 기록 기반 되돌리기와 실패 원인 Event/UI 추가
3. 검수된 SVG/오디오 매니페스트를 PreloadScene 및 AudioManager에 연결

세부 의존 관계는 [ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

# 콘텐츠 스키마

모든 콘텐츠는 직렬화 가능한 값과 Core 타입만 사용하며 Phaser 객체, React 컴포넌트, DOM 참조를
포함하지 않습니다. 현재 TypeScript 정의는 컴파일 시 관계까지 검사합니다.

## 정의

- 캐릭터: `id`, `kind`, 시작 `position`, `attention`, 논리 `graphicKey`
- 오브젝트: `id`, `kind`, 시작 `position`, `location`, `condition`, `graphicKey`, `draggable`
- 규칙: Stage의 `activeRuleIds`가 Core rule registry의 논리 ID를 선택합니다. 현재 예제 ID는
  `rule.cat-interest-on-bottle-at-desk`입니다. registry 일반화는 두 번째 Rule 추가 시 진행합니다.
- 목표: 현재 `stable-object-state`가 `objectId`, `location`, `state`, `durationMs`를 요구합니다.
- 스테이지: `id`, `mission`, actors, objects, activeRuleIds, goal, graphicKeys, soundEvents로 구성됩니다.

## 새 스테이지 추가

1. `src/content/stages/stage-NNN.ts`에서 `satisfies StageDefinition`으로 데이터를 선언합니다.
2. 모든 entity ID가 Stage 내에서 고유하고 Goal의 objectId가 실제로 존재하는지 확인합니다.
3. `src/content/stages/index.ts`에서 export하고 `scripts/validate-stages.ts` 목록에 추가합니다.
4. Rule ID가 새롭다면 Core에 순수 함수로 구현하고 Event만 방출합니다.
5. 논리 graphic key와 SoundEvent를 매니페스트에 연결합니다.
6. `tests/stages`에서 참조 무결성, `tests/core`에서 규칙/목표 행동을 검증합니다.

위치나 상태 문자열을 임의로 늘리기 전에 `core/types/identifiers.ts`의 도메인 타입을 확장합니다.

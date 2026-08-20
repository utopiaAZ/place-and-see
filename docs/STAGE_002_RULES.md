# Stage 2 퍼즐 규칙

## 목표

서류가 `document-desk`에 있고 구조적인 보호 수단이 활성화된 상태를 Core 가상 시간 기준 3초 동안
유지하면 완료됩니다. 선풍기가 잠시 반대 방향을 보는 것만으로는 안정성 시간이 증가하지 않습니다.

## 선풍기와 기본 실패

`StageTwoRuleSystem`은 `away → turning-toward-desk → toward-desk → turning-away`를 각 1000ms씩
결정적으로 순환합니다. 보호되지 않은 서류는 책상 방향의 바람을 받으면 700ms 동안 `fluttering` 상태를
거친 뒤 `blown-away`가 되어 바닥으로 이동합니다. Phaser Tween은 이 결과를 표현할 뿐 결과 시점은
`ADVANCE_TIME`이 정합니다.

## 세 가지 해결법

- 플러그: `plug-unplugged` zone에 놓으면 600ms 감속 후 선풍기가 완전히 정지합니다. 감속이 끝나기
  전에는 안전한 것으로 판정하지 않습니다.
- 물병 문진: 서류를 먼저 책상에 놓고 물병을 `paper-weight` zone에 놓아야 보호됩니다. 물병을 집으면
  보호가 즉시 해제됩니다.
- 파일꽂이: 선풍기와 서류 사이의 명시적 `airflow-blocker` zone에 놓았을 때만 바람을 막습니다.
  다른 책상 위치는 보호로 인정하지 않습니다.

날아간 서류는 자동 reset되지 않으며 다시 집어 재시도할 수 있습니다. 성공 후에는 모든 입력과
불필요한 행동 loop가 잠깁니다.

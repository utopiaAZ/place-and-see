# Stage 3 — 생일 케이크 준비

## 목표

케이크가 `cake-desk`에 있고 손상되지 않았으며 촛불이 켜진 상태에서, 고양이 위협과 바람을 모두 구조적으로 처리한 상태를 Core 가상 시간 3초 동안 유지하면 완료됩니다. 선풍기가 잠시 반대쪽을 보는 것은 보호로 인정하지 않습니다.

## 행동과 순서

권장 흐름은 고양이 처리 → 선풍기 처리 → 케이크 배치 → 점화 → 3초 유지입니다. 순서를 하나로 강제하지 않지만, 이 구현은 명세가 허용한 단순화에 따라 **케이크가 책상에 있을 때만 촛불을 점화**할 수 있습니다. 켜진 케이크를 집으면 즉시 `CANDLE_BLOWN_OUT(reason: movement)`가 발생하고 재점화해야 합니다.

라이터 판정은 케이크 root의 현재 world position/scale과 candle local anchor에서 매번 계산한 ignition bounds를 사용합니다. 라이터의 명시적 hit bounds가 이 영역과 겹치면 일반 desk drop보다 먼저 `LIGHT_CANDLE` Command로 해석합니다. 개발 환경의 `?stage=003&debugZones=1`에서는 cake, lighter와 ignition bounds 및 Command/Candle Event/flame 상태를 확인할 수 있습니다.

## 고양이

- 간식은 고양이를 영구 분산합니다.
- 장난감은 정확히 5초 동안 분산합니다. 안정성 판정 중 시간이 끝나면 진행률이 즉시 0으로 초기화되고, 600ms 복귀 후 케이크 공격을 다시 시작합니다.
- active 고양이는 케이크 배치 후 감지 → 관심 → 점프 준비 → 점프/착지 → 타격 순서로 움직입니다. 점프 전에는 주의 분산으로 취소할 수 있고, 케이크를 치면 `damaged`와 `floor` 상태가 되어 reset 전에는 성공할 수 없습니다.

## 선풍기와 촛불

Stage 2의 1000ms 방향 cycle, 900°/s blade 표현, plug, 전원 코드, 600ms 감속과 파일꽂이 zone을 재사용합니다. 구조적 보호는 완전 정지 또는 `airflow-blocker`의 파일꽂이입니다. powered airflow가 켜진 촛불에 닿으면 450ms flicker 예고 뒤 꺼집니다. 예고 중 보호가 완성되면 다시 `lit`으로 돌아가지만, 이미 꺼진 촛불은 자동 점화되지 않습니다.

## 결정성

점화 300ms 뒤 완전히 켜진 `lit` 상태를 100ms 표시하고, 고양이 전이, 장난감 5000ms, 선풍기 cycle/감속, flicker 450ms, 안정성 3000ms는 모두 `ADVANCE_TIME` 경계로 처리합니다. 100ms 표시 구간이 끝난 뒤에만 유효한 바람이 450ms flicker를 시작합니다. Core는 DOM/Phaser timer를 사용하지 않으며 큰 tick과 작은 tick의 주요 Event 순서가 동일합니다.

## 네 가지 조합

- 간식 + 플러그
- 간식 + 파일꽂이
- 장난감 + 플러그
- 장난감 + 파일꽂이

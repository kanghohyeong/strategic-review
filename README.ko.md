# 전략 검토 스킬

이 스킬은 주어진 목표를 달성하기 위한 여러 방법론을 비교 및 분석하고 의사 결정 논리와 근거를 제공합니다.

## Problem

- claude code 를 활용할 때 가장 기본적인 워크플로우는 [plan -> review -> accept] 입니다.
- plan 단계에서 에이전트는 요구사항을 달성하기 위한 '단 하나'의 방법(최적해)을 '암시적'으로 산정하며 해당 방법으로 수행하기 위한 '자세한' 단계별 계획을 산출합니다.
- 이는 빠르게 수행 단계로 넘어가는데 매우 효과적이지만 에이전트가 최적해를 찾을 수 있다는 낙관적인 가정을 기반합니다. 
- 에이전트가 최적해를 찾기 위해서는 모든 변수가 제공되어야 하며 그로인해 사용자에게 상세한 요구사항과 충분한 컨텍스트를 강요합니다.
- 하지만 책 '실용주의 프로그래머' 의 구절을 인용하자면 '무엇을 다루든 정확한 명세란 것은 거의 불가능' 합니다. 
- 또한 사용자가 메모리 지옥, 규칙 문서 지옥에 빠지게 만들며 심각한 컨텍스트 오염을 야기합니다.
- 사용자의 역할은 '해야할 일을 정확하게 기술'하는 것으로, 에이전트의 역할은 '기술된 일을 정확히 해내는 것' 으로 제한됩니다. 방대한 지식과 놀라운 창의성을 가진 에이전트가 단순한 '빠른 일꾼' 으로 전락하며 오직 사용자의 지식과 사고력 만큼만 생산적인 도구가 됩니다.


## Solve

- plan 이전에 요구사항을 달성하기 위한 여러 방법론을 비교 및 분석하고 사용자가 의사 결정하는데 도움이 되는 정보를 제공하는 strategic-review 과정을 추가합니다. 
- 에이전트가 단일 최적해를 임의로 결정하는 대신, 기술적 트레이드오프(장단점), 예상 리스크, 구현 난이도가 포함된 여러 가지 시나리오를 사용자에게 제안합니다.
- 사용자는 복잡한 명세와 상세한 규칙을 사전에 정의하는 부담에서 벗어나, 에이전트가 제시한 선택지 중 최적의 경로를 '선택'하고 '피드백'함으로써 자연스럽게 현실 세계의 방대한 맥락과 에이전트의 제한된 컨텍스트가 동기화되도록 유도합니다.
- 에이전트가 단순한 '수행 도구'를 넘어 '똑똑한 동료'로서 기능합니다. 에이전트가 보유한 방대한 지식을 바탕으로 사용자가 미처 생각하지 못한 대안이나 최신 기술적 접근법을 제안받을 수 있어, 결과물의 품질이 사용자의 지식 수준 이상으로 확장됩니다.
- '암시적'으로 결정되던 수행 방식이 '명시적'인 비교 문서로 제공됩니다. 사용자는 왜 이 방법이 선택되었는지 논리적 근거를 확인할 수 있으며, 계획(plan) 단계로 넘어가기 전 방향성을 확정함으로써 재작업의 가능성을 낮춥니다.

## 제공하는 것

- `strategic-review` 스킬을 제공합니다. 해당 스킬을 통해 아래 형식에 해당하는 전략 검토 보고서를 제공받을 수 있습니다.

| Section Name | Key Items | Writing Guide |
| --- | --- | --- |
| **1. Current Overview** | Background & Core Challenges | Describe the fundamental problem and current status using objective metrics. |
| **2. Decision Criteria** | Evaluation Principles & Constraints | Specify criteria for evaluating alternatives (e.g., cost-effectiveness, speed, stability) and budget/technical limitations. |
| **3. Multi-Alternative Analysis** | Scenario-based Options | Present at least 2–3 independent alternatives. Define the core value and operational mechanism of each. |
| **4. Comparative Analysis Table** | Trade-offs | Contrast the pros/cons, budget, expected performance, and risks of each alternative for an at-a-glance comparison. |
| **5. Practical Recommendation** | Review Opinion & Rationale | Recommend the most suitable option from a practical perspective, framed as **'opinion for decision support'** rather than a final conclusion. |
| **6. Risk Management** | Potential Risks & Mitigation | Transparently disclose potential side effects of each choice and the management systems to control them. |
| **7. Implementation Roadmap** | Step-by-Step Plan | Provide milestones and resource allocation plans for immediate execution of the chosen option. |
| **8. Expected Effects & KPIs** | Performance Measurement & Definition of Done | Set objective data and quantitative indicators to prove the success of the decided plan. |

- 브라우저 인터페이스를 제공하며 해당 인터페이스와 에이전트의 효과적인 통합을 위한 `strategic-review-interactive` 스킬을 제공합니다. 체계적인 의사 결정 문서 관리 도구를 도입하고 싶은 사용자에게 추천합니다.

## 설치

### only skill (필수)
```
npx skills add https://github.com/kanghohyeong/strategic-review-skill --skill strategic-review
```

### browser interface (optional)
```
# 인터페이스 통합 스킬 설치
npx skills add https://github.com/kanghohyeong/strategic-review-skill --skill strategic-review-interactive
```

```
# 브라우저 인터페이스 실행
npx -y strategic-review-webui -- --port 3131
``` 
브라우저 인터페이스 실행 명령어를 입력하면 로컬 호스트로 서버를 실행하며 해당 경로에서 GUI 기반으로 전략 검토를 진행할 수 있습니다.


## 가이드
- plan 대신 사용하지 마세요. plan 은 방향성이 구체화된 이후에 여전히 강력합니다.
  - 기존 워크플로우 : plan -> review -> accept
  - 추가되는 워크플로우 : strategic-review -> plan -> review -> accept
- 토큰 효율이나 작업 속도 등을 고려했을때, 항상 사용할 필요는 없습니다만, 사고의 확장이라는 측면에서 항상 적극적으로 활용할 것을 권장드립니다. (스스로 방향이 뚜렷하다고 생각되는 순간에도!)

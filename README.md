# Strategic Review Skill

> Also available in: [한국어](./README.ko.md)

This skill compares and analyzes multiple methodologies to achieve a given goal, and provides decision-making logic and rationale.

## Problem

- The most fundamental workflow when using Claude Code is **[plan → review → accept]**.
- In the **plan** phase, the agent *implicitly* determines a single optimal solution and produces a detailed step-by-step plan to execute it.
- This is highly effective for moving quickly into execution, but it rests on the optimistic assumption that the agent can always find the optimal solution.
- Finding the optimal solution requires all variables to be provided upfront, which forces the user to supply detailed requirements and sufficient context.
- Yet, as quoted from *The Pragmatic Programmer*: *"An exact specification of almost anything is almost impossible."*
- This workflow also traps users in a maze of memory files and rule documents, causing serious context pollution.
- The user's role becomes narrowly defined as *"precisely describing what needs to be done"*, and the agent's role as *"precisely executing what was described"* — reducing a vastly knowledgeable and creative agent to a mere fast executor, productive only up to the limit of the user's own knowledge.

## Solution

- Before the **plan** phase, a **strategic-review** step is introduced: it compares and analyzes multiple methodologies for achieving the requirements, and provides information to help the user make informed decisions.
- Instead of arbitrarily deciding on a single optimal solution, the agent proposes multiple scenarios — each with technical trade-offs, expected risks, and implementation difficulty — for the user to choose from.
- Users are freed from the burden of defining complex specifications and detailed rules upfront. By *selecting* and *giving feedback on* the best path from the agent's proposed options, the vast context of the real world and the agent's limited context naturally synchronize.
- The agent functions not merely as an *execution tool*, but as a *smart collaborator*. Leveraging its extensive knowledge, it can suggest alternatives or cutting-edge approaches the user may not have considered, extending the quality of outcomes beyond the user's own level of knowledge.
- The *implicitly* decided approach is now surfaced as an *explicit* comparative document. Users can see the logical rationale for why a method was chosen, and by locking in the direction before moving to the plan phase, the likelihood of rework is reduced.

## What It Provides

- Provides the `strategic-review` skill, which delivers a **Strategic Review Report** in the following format:

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

- Also provides a **browser interface** and the `strategic-review-interactive` skill for effective integration between the interface and the agent. Recommended for users who want to introduce a systematic decision-making document management tool.

## Installation

### Only Skill (Required)
```bash
npx skills add https://github.com/kanghohyeong/strategic-review-skill --skill strategic-review
```

### Browser Interface (Optional)
```bash
# Install the interface integration skill
npx skills add https://github.com/kanghohyeong/strategic-review-skill --skill strategic-review-interactive
```

```bash
# Run the browser interface
npx -y strategic-review-webui -- --port 3131
```
Running the browser interface command starts a server on localhost, where you can conduct strategic reviews via a GUI.

## Guide

- **Do not use it as a replacement for `plan`.** The plan phase remains powerful once the direction has been solidified.
  - Existing workflow: `plan → review → accept`
  - Extended workflow: `strategic-review → plan → review → accept`
- While always using it may not be necessary considering token efficiency or task speed, it is strongly recommended to actively use it from the perspective of expanding your thinking — even when you feel the direction is already clear!

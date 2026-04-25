import { Report } from '../report/report'
import { ReportGroup } from '../report/report'

const REPORT_SECTIONS_GUIDE = `보고서는 아래 8개 섹션을 반드시 포함해야 합니다.

| Section Name | Key Items | Writing Guide |
| --- | --- | --- |
| **1. Current Overview** | Background & Core Challenges | Describe the fundamental problem and current status using objective metrics. |
| **2. Decision Criteria** | Evaluation Principles & Constraints | Specify criteria for evaluating alternatives (e.g., cost-effectiveness, speed, stability) and budget/technical limitations. |
| **3. Multi-Alternative Analysis** | Scenario-based Options | Present at least 2–3 independent alternatives. Define the core value and operational mechanism of each. |
| **4. Comparative Analysis Table** | Trade-offs | Contrast the pros/cons, budget, expected performance, and risks of each alternative for an at-a-glance comparison. |
| **5. Practical Recommendation** | Review Opinion & Rationale | Recommend the most suitable option from a practical perspective, framed as 'opinion for decision support' rather than a final conclusion. |
| **6. Risk Management** | Potential Risks & Mitigation | Transparently disclose potential side effects of each choice and the management systems to control them. |
| **7. Implementation Roadmap** | Step-by-Step Plan | Provide milestones and resource allocation plans for immediate execution of the chosen option. |
| **8. Expected Effects & KPIs** | Performance Measurement & Definition of Done | Set objective data and quantitative indicators to prove the success of the decided plan. |`

export class Prompt {
  private constructor(private readonly text: string) {}

  static from(report: Report, group: ReportGroup, patchUrl: string): Prompt {
    if (report.status === 'init') return new Prompt(Prompt.buildForInit(report, patchUrl))
    if (report.status === 'revision') return new Prompt(Prompt.buildForRevision(report, group, patchUrl))
    return new Prompt('')
  }

  toString(): string {
    return this.text
  }

  private static buildForInit(report: Report, patchUrl: string): string {
    const patchCmd = `PATCH ${patchUrl}\nContent-Type: text/markdown\nBody: (작성한 보고서 전문)`
    const lines = [
      '아래 목표와 제약사항을 바탕으로 전략 검토 보고서를 Markdown 형식으로 작성하고,',
      '작성이 완료되면 다음 API로 저장하세요.',
      '',
      `목표: ${report.objective}`,
    ]
    if (report.constraints) lines.push(`제약사항: ${report.constraints}`)
    lines.push('', REPORT_SECTIONS_GUIDE, '', '저장 방법:', patchCmd)
    return lines.join('\n')
  }

  private static buildForRevision(report: Report, group: ReportGroup, patchUrl: string): string {
    const patchCmd = `PATCH ${patchUrl}\nContent-Type: text/markdown\nBody: (작성한 보고서 전문)`

    const reviewHistories = group.allFiles
      .filter(f => f.status === 'reject' && f.reviewComment)
      .reverse()
      .map(f => `[v${f.version} 검토 의견]\n${f.reviewComment}`)
      .join('\n\n')

    const lastRejectedContent = group.allFiles.find(f => f.status === 'reject')?.content ?? ''

    return [
      '아래 리뷰 코멘트를 반영하여 전략 검토 보고서를 수정하고,',
      '수정이 완료되면 다음 API로 저장하세요.',
      '',
      `목표: ${report.objective}`,
      '',
      '=== 지난 버전 검토 의견 ===',
      reviewHistories,
      '',
      '=== 수정 대상 보고서 (마지막 제출 버전) ===',
      lastRejectedContent,
      '',
      REPORT_SECTIONS_GUIDE,
      '',
      '저장 방법:',
      patchCmd,
    ].join('\n')
  }
}

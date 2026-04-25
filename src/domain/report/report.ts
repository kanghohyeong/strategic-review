export type ReportStatus = 'init' | 'submit' | 'approve' | 'reject' | 'revision'

interface ReportProps {
  filename: string
  prefix: string
  version: number
  name: string
  objective: string
  constraints: string
  status: ReportStatus
  content: string
  reviewComment?: string
}

export class Report {
  readonly filename: string
  readonly prefix: string
  readonly version: number
  readonly name: string
  readonly objective: string
  readonly constraints: string
  private _status: ReportStatus
  private _content: string
  private _reviewComment?: string

  private constructor(props: ReportProps) {
    this.filename = props.filename
    this.prefix = props.prefix
    this.version = props.version
    this.name = props.name
    this.objective = props.objective
    this.constraints = props.constraints
    this._status = props.status
    this._content = props.content
    this._reviewComment = props.reviewComment
  }

  static create(params: { prefix: string; version: number; name: string; objective: string; constraints: string }): Report {
    return new Report({
      filename: `${params.prefix}.v${params.version}.md`,
      prefix: params.prefix,
      version: params.version,
      name: params.name,
      objective: params.objective,
      constraints: params.constraints,
      status: 'init',
      content: '',
    })
  }

  static reconstitute(props: ReportProps): Report {
    return new Report(props)
  }

  get status(): ReportStatus {
    return this._status
  }

  get content(): string {
    return this._content
  }

  get reviewComment(): string | undefined {
    return this._reviewComment
  }

  submit(content: string): void {
    this._content = content
    this._status = 'submit'
  }

  approve(comment?: string): void {
    this._status = 'approve'
    this._reviewComment = comment
  }

  reject(comment: string): void {
    this._status = 'reject'
    this._reviewComment = comment
  }

  nextRevision(): Report {
    return new Report({
      filename: `${this.prefix}.v${this.version + 1}.md`,
      prefix: this.prefix,
      version: this.version + 1,
      name: this.name,
      objective: this.objective,
      constraints: this.constraints,
      status: 'revision',
      content: '',
      reviewComment: this._reviewComment,
    })
  }
}

export class ReportGroup {
  constructor(
    readonly prefix: string,
    readonly allFiles: Report[],
  ) {}

  get latestFile(): Report {
    return this.allFiles[0]
  }

  getLatestVersion(): number {
    return this.allFiles[0].version
  }
}

export interface PaginatedGroups {
  groups: ReportGroup[]
  currentPage: number
  totalPages: number
  totalCount: number
}

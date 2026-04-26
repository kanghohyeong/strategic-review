import { getDb } from './infrastructure/db'
import { SqliteRepository } from './adapters/outbound/sqlite/sqlite.repository'
import { ReportUseCases } from './application/use-cases/report.use-cases'
import { PromptUseCases } from './application/use-cases/prompt.use-cases'
import { createApp } from './infrastructure/app'
import { MarkdownPromptRepository } from './adapters/outbound/markdown/markdown-prompt.repository'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const db = getDb()
const repository = new SqliteRepository(db)
const useCases = new ReportUseCases(repository)
const promptUseCases = new PromptUseCases(new MarkdownPromptRepository())
const app = createApp(useCases, promptUseCases)

app.listen(PORT, () => {
  console.log(`Strategic Review Server running at http://localhost:${PORT}`)
})

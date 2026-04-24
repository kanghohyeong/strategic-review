import { getDb } from './infrastructure/db'
import { SqliteRepository } from './adapters/outbound/sqlite/sqlite.repository'
import { ReportUseCases } from './domain/report/report.use-cases'
import { PromptUseCases } from './domain/prompt/prompt.use-cases'
import { createApp } from './infrastructure/app'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const db = getDb()
const repository = new SqliteRepository(db)
const useCases = new ReportUseCases(repository)
const promptUseCases = new PromptUseCases()
const app = createApp(useCases, promptUseCases)

app.listen(PORT, () => {
  console.log(`Strategic Review Server running at http://localhost:${PORT}`)
})

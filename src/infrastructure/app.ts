import express from 'express'
import path from 'path'
import { ReportServicePort } from '../application/ports/inbound/report.service.port'
import { PromptServicePort } from '../application/ports/inbound/prompt.service.port'
import { createWebRouter } from '../adapters/inbound/http/web/web.routes'
import { createApiRouter } from '../adapters/inbound/http/api/api.routes'
import { SseNotifier } from '../adapters/inbound/http/api/sse.notifier'

export function createApp(reportService: ReportServicePort, promptService: PromptServicePort): express.Application {
  const app = express()

  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, '..', '..', 'views'))

  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  app.use(express.text({ type: ['text/plain', 'text/markdown'] }))
  app.use(express.static(path.join(__dirname, '..', '..', 'public')))

  const sseNotifier = new SseNotifier()

  app.use('/', createWebRouter(reportService, promptService))
  app.use('/', createApiRouter(reportService, sseNotifier))

  return app
}

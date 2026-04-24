import express from 'express'
import path from 'path'
import { ReportServicePort } from '../domain/ports/report.service.port'
import { createWebRouter } from '../adapters/inbound/http/web/web.routes'
import { createApiRouter } from '../adapters/inbound/http/api/api.routes'

export function createApp(service: ReportServicePort): express.Application {
  const app = express()

  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, '..', '..', 'views'))

  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  app.use(express.text({ type: ['text/plain', 'text/markdown'] }))
  app.use(express.static(path.join(__dirname, '..', '..', 'public')))

  app.use('/', createWebRouter(service))
  app.use('/', createApiRouter(service))

  return app
}

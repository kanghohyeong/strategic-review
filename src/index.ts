import express from 'express'
import path from 'path'
import { router } from './routes'
import { getDb } from './db'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'views'))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use('/', router)

// npm run dev 경로에서도 DB lazy init 보장
getDb()

app.listen(PORT, () => {
  console.log(`Strategic Review Server running at http://localhost:${PORT}`)
})

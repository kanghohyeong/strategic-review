#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { initDb } from './db'

// Parse --port argument
const args = process.argv.slice(2)
const portIdx = args.indexOf('--port')
if (portIdx !== -1 && args[portIdx + 1]) {
  process.env.PORT = args[portIdx + 1]
}

// Set .strategic directory based on current working directory
const strategicDir = path.join(process.cwd(), '.strategic')
process.env.STRATEGIC_DIR = strategicDir

if (!fs.existsSync(strategicDir)) {
  console.log(`[strategic-review-webui] .strategic/ directory not found in ${process.cwd()}`)
  console.log(`[strategic-review-webui] Creating .strategic/ directory...`)
  fs.mkdirSync(strategicDir, { recursive: true })
  console.log(`[strategic-review-webui] Done.`)
}

initDb(strategicDir)

// Start the server
require('./index')

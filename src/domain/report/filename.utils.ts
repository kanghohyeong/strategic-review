const FILENAME_REGEX = /^\d{8}_\d{6}(_\d+)?\.v\d+\.md$/

export function isValidFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename)
}

export function parseFilename(filename: string): { prefix: string; version: number } {
  const match = filename.match(/^(\d{8}_\d{6}(?:_\d+)?)\.v(\d+)\.md$/)
  if (!match) throw new Error(`Invalid filename: ${filename}`)
  return {
    prefix: match[1],
    version: parseInt(match[2], 10),
  }
}

export function generatePrefix(now: Date, counter: number): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const base = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
  return counter === 0 ? base : `${base}_${counter}`
}

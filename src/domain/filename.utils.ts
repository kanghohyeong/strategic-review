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

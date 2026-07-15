import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const statesDirectory = join(process.cwd(), 'public/maps/states')
const outputPath = join(statesDirectory, 'index.json')

function parseStateFile(fileName, text) {
  const id = text.match(/\bid\s*=\s*(\d+)/)?.[1]
  const name = text.match(/\bname\s*=\s*"([^"]+)"/)?.[1] ?? `STATE_${id}`
  const commentName = text.match(/\bname\s*=\s*"[^"]+"\s*#\s*(.+)/)?.[1]?.trim()
  const provincesBlock = text.match(/\bprovinces\s*=\s*\{([\s\S]*?)\}/)?.[1] ?? ''
  const provinces = provincesBlock.match(/\d+/g) ?? []

  if (!id || provinces.length === 0) {
    return null
  }

  return {
    id,
    name,
    displayName: commentName || name,
    file: fileName,
    provinces,
  }
}

const fileNames = (await readdir(statesDirectory))
  .filter((fileName) => fileName.endsWith('.txt'))
  .sort((a, b) => Number(a.split('-')[0]) - Number(b.split('-')[0]))

const states = []
const provinceToState = {}

for (const fileName of fileNames) {
  const text = await readFile(join(statesDirectory, fileName), 'utf8')
  const state = parseStateFile(fileName, text)

  if (!state) {
    continue
  }

  states.push(state)

  for (const provinceId of state.provinces) {
    provinceToState[provinceId] = state.id
  }
}

await writeFile(
  outputPath,
  `${JSON.stringify({ version: 1, states, provinceToState }, null, 2)}\n`,
)

console.log(`Generated ${outputPath} with ${states.length} states.`)

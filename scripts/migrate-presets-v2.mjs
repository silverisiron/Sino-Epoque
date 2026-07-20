import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePreset } from '../src/map/presetSchema.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const presetsDirectory = path.join(projectRoot, 'public/maps/presets')
const fileNames = (await readdir(presetsDirectory)).filter(
  (fileName) => fileName.endsWith('.json') && fileName !== 'index.json',
)

for (const fileName of fileNames) {
  const filePath = path.join(presetsDirectory, fileName)
  const preset = JSON.parse(await readFile(filePath, 'utf8'))
  const normalizedPreset = normalizePreset(preset)
  await writeFile(filePath, `${JSON.stringify(normalizedPreset, null, 2)}\n`)
  console.log(`Migrated ${fileName} to preset version 2.`)
}

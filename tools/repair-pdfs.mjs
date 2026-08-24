import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const docsDirectory = fileURLToPath(new URL('../frontend/public/docs/', import.meta.url))

for (const name of await readdir(docsDirectory)) {
  if (!name.toLowerCase().endsWith('.pdf')) continue

  const path = join(docsDirectory, name)
  let source = (await readFile(path)).toString('latin1').replace(/\r\n?/g, '\n')
  source = source.slice(0, source.search(/^xref$/m)).trimEnd()

  source = source.replace(
    /(\d+\s+\d+\s+obj\s*\n<<[^>]*\/Length\s+)\d+(\s*>>\s*\nstream\n)([\s\S]*?)(\nendstream)/g,
    (_match, header, streamStart, stream) =>
      `${header}${Buffer.byteLength(stream, 'latin1')}${streamStart}${stream}\nendstream`,
  )

  const objectMatches = [...source.matchAll(/^(\d+)\s+\d+\s+obj$/gm)]
  const maxObjectNumber = Math.max(...objectMatches.map((match) => Number(match[1])))
  const offsets = new Map(objectMatches.map((match) => [Number(match[1]), match.index]))
  const xrefOffset = Buffer.byteLength(`${source}\n`, 'latin1')

  const entries = ['0000000000 65535 f ']
  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    const offset = offsets.get(objectNumber)
    entries.push(offset === undefined
      ? '0000000000 00000 f '
      : `${String(offset).padStart(10, '0')} 00000 n `)
  }

  const repaired = `${source}\nxref\n0 ${maxObjectNumber + 1}\n${entries.join('\n')}\ntrailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  await writeFile(path, Buffer.from(repaired, 'latin1'))
}

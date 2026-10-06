// One-off: correct the swapped Spanish copy in an existing CMS (review finding
// on PR #15). The seed files are fixed, but `import-copy` only fills empty
// slots, so a CMS that already imported the swapped values keeps them.
//
// Only a slot whose current Spanish value is exactly the known-wrong one (or
// still empty) is changed; anything an editor has changed since is left alone and reported.
// Rows with an open draft are skipped. Without --apply it only reports what it
// would do. Needs EMDASH_URL (default http://localhost:4321) and
// EMDASH_SYNC_PAT (content:read + content:write).
import { EmDashClient } from 'emdash/client'
import { copyCollectionFor } from '../../src/lib/cmsNavigation.mjs'

// [route, key, swapped value, correct value]
export const CORRECTIONS = [
  ['/', 'hero.label.1', 'Formas de ayudar', 'Apadrina a un niño'],
  ['/', 'hero.label.2', 'Apadrina a un niño', 'Formas de ayudar'],
  ['/sponsor-a-child', 'button4.text', 'Formas de ayudar', 'Apadrina a un niño'],
  ['/sponsor-a-child', 'programsCta.label.1', 'Formas de ayudar', 'Apadrina a un niño'],
  ['/blog', 'filter.Stories', 'Finanzas y transparencia', 'Historias'],
  ['_global', 'footer.link.sponsorChild', 'Formas de ayudar', 'Apadrina a un niño'],
  ['_global', 'footer.link.waysToGive', 'Apadrina a un niño', 'Formas de ayudar'],
  ['_global', 'child.breadcrumb', 'Formas de ayudar', 'Apadrina a un niño'],
  ['_global', 'resources.heading', 'Nosotros', 'Recursos'],
  ['_global', 'resources.category.stories', 'Finanzas y transparencia', 'Historias'],
]

export async function fixCopy({
  apply = process.argv.includes('--apply'),
  baseUrl = process.env.EMDASH_URL ?? 'http://localhost:4321',
  token = process.env.EMDASH_SYNC_PAT,
  client = token ? new EmDashClient({ baseUrl, token }) : undefined,
  corrections = CORRECTIONS,
  log = console.log,
} = {}) {
  if (!client) throw new Error('fixCopy needs EMDASH_SYNC_PAT (a token with content:read + content:write)')
  const result = { fixed: [], alreadyRight: [], edited: [], draft: [], missing: [] }
  const rowsByCollection = new Map()
  const rowsFor = async (collection) => {
    if (!rowsByCollection.has(collection)) {
      const rows = new Map()
      try {
        for await (const item of client.listAll(collection, { locale: 'es' })) rows.set(item.data.key, item)
      } catch (error) {
        if (error?.status !== 404) throw error
      }
      rowsByCollection.set(collection, rows)
    }
    return rowsByCollection.get(collection)
  }
  for (const [route, key, wrong, right] of corrections) {
    const collection = copyCollectionFor(route)
    const label = `${route} ${key}`
    const row = (await rowsFor(collection)).get(key)
    const current = row?.data?.value
    if (!row) result.missing.push(label)
    else if (current === right) result.alreadyRight.push(label)
    else if (current && current !== wrong) result.edited.push(`${label}: "${current}"`)
    else if (row.draftRevisionId) result.draft.push(label)
    else {
      if (apply) {
        await client.update(collection, row.id, { data: { value: right }, _rev: row._rev })
        await client.publish(collection, row.id)
      }
      result.fixed.push(`${label}: ${current ? `"${current}"` : '(empty)'} → "${right}"`)
    }
  }
  log(`${apply ? 'Fixed' : 'Would fix (re-run with --apply)'}: ${result.fixed.length}`)
  for (const line of result.fixed) log(`  ${line}`)
  log(`Already right: ${result.alreadyRight.length}`)
  if (result.edited.length) log(`Changed by someone since, left alone:\n  ${result.edited.join('\n  ')}`)
  if (result.draft.length) log(`Open draft, skipped: ${result.draft.join(', ')}`)
  if (result.missing.length) log(`No Spanish row: ${result.missing.join(', ')}`)
  return result
}

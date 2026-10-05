import { readdirSync } from 'node:fs'
import path from 'node:path'
import { EmDashApiError, EmDashClient } from 'emdash/client'
import { copyCollectionFor } from './cmsNavigation.mjs'
import { slotLayout } from './copyCollections.mjs'
import { GLOBAL_ROUTE, slotFormat, type CopyManifest, type SlotSpec } from './copy'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './i18n'

// [slug].astro detail routes and their matching index.astro listing route
// are already represented by their own EmDash collection - excluded here so
// the `pages` collection only covers routes with no other EmDash presence.
// (A listing route still gets a `pages` row when it declares copy slots.)
const COLLECTION_INDEX_ROUTES = new Set([
  'blog/index.astro',
  'events/index.astro',
  'our-team/index.astro',
  'resources/index.astro',
  'sponsor-a-child/children/index.astro',
])

export interface StaticPageRoute {
  routePath: string
  sourceFile: string
}

function toRoutePath(relFile: string): string {
  const withoutIndex = relFile.replace(/(^|\/)index\.astro$/, '')
  const withoutExt = withoutIndex.replace(/\.astro$/, '')
  const route = `/${withoutExt}`.replace(/\/+/g, '/').replace(/\/$/, '')
  return route === '' ? '/' : route
}

// Page files as repository-relative paths ('src/pages/contact/index.astro').
// The server gets them from import.meta.glob keys, resolved at build time, so
// the running image needs no source tree (make-app-portable, design D5);
// listPageFiles reads them from disk for tests and scripts.
export function pageFilesFromGlob(keys: string[]): string[] {
  return keys.map((k) => k.replace(/^\//, '')).sort()
}

export function listPageFiles(pagesDir: string): string[] {
  const entries = readdirSync(pagesDir, { recursive: true }) as string[]
  return entries
    .map((entry) => `src/pages/${entry.split(/[\\/]/).join('/')}`)
    .filter((f) => f.endsWith('.astro'))
    .sort()
}

export function scanStaticPageRoutes(pagesDir: string): StaticPageRoute[] {
  return staticRoutesFrom(listPageFiles(pagesDir))
}

export function staticRoutesFrom(pageFiles: string[]): StaticPageRoute[] {
  const relPaths = pageFiles.map((f) => f.replace(/^src\/pages\//, ''))

  return relPaths
    .filter((rel) => rel.endsWith('.astro'))
    .filter((rel) => !rel.includes('[')) // dynamic routes belong to a collection
    .filter((rel) => !COLLECTION_INDEX_ROUTES.has(rel))
    .map((rel) => ({
      routePath: toRoutePath(rel),
      sourceFile: `src/pages/${rel}`,
    }))
    .sort((a, b) => a.routePath.localeCompare(b.routePath))
}

// A copy manifest together with the page file that uses it (for the
// `pages` inventory row of routes found only through their manifest).
export interface ManifestSource {
  manifest: CopyManifest
  sourceFile: string
}

// Copy manifests are `_copy.ts` files next to their page; each default-exports
// one manifest or an array of them (e.g. one per resource category). Keys are
// module paths as returned by import.meta.glob ('/src/pages/events/_copy.ts').
export function manifestSources(
  modules: Record<string, { default: CopyManifest | CopyManifest[] }>,
  pageFiles: string[]
): ManifestSource[] {
  return Object.entries(modules).flatMap(([modulePath, mod]) => {
    const rel = modulePath.replace(/^\//, '')
    const manifests = Array.isArray(mod.default) ? mod.default : [mod.default]
    return manifests.map((manifest) => ({ manifest, sourceFile: pageFileNextTo(rel, pageFiles) }))
  })
}

// The page a manifest belongs to: for `_copy.detail.ts` the directory's
// dynamic template ([slug].astro); for `_copy.ts` its index.astro, else the
// directory's only other page (e.g. [category].astro); else the manifest
// itself (site-wide copy).
function pageFileNextTo(relManifest: string, pageFiles: string[]): string {
  const dir = path.posix.dirname(relManifest)
  const inDir = pageFiles.filter((f) => path.posix.dirname(f) === dir).map((f) => path.posix.basename(f))
  if (relManifest.endsWith('_copy.detail.ts')) {
    const template = inDir.find((f) => f.startsWith('[') && f.endsWith('.astro'))
    return template ? `${dir}/${template}` : relManifest
  }
  if (inDir.includes('index.astro')) return `${dir}/index.astro`
  const page = inDir.find((f) => f.endsWith('.astro'))
  return page ? `${dir}/${page}` : relManifest
}

// The subset of EmDashClient the sync uses (injectable for tests).
type Client = Pick<EmDashClient, 'listAll' | 'create' | 'update' | 'publish' | 'delete'>
type Item = Awaited<ReturnType<Client['create']>>

export interface SyncStaticPagesOptions {
  baseUrl: string
  token: string
  // Repository-relative page files (see pageFilesFromGlob / listPageFiles).
  pageFiles: string[]
  manifests?: ManifestSource[]
  client?: Client
}

export interface SyncStaticPagesResult {
  created: number
  updated: number
  markedStale: number
  slotsCreated: number
  slotsUpdated: number
  slotsMarkedStale: number
  // Duplicate rows (e.g. from overlapping sync runs) moved to trash.
  duplicatesRemoved: number
  // Slots whose metadata changed in code but that have an unpublished editor
  // draft: left alone so the sync never publishes someone's draft.
  slotsSkippedForDraft: string[]
  // Copy collections that don't exist yet (run `npm run cms:schema`); their
  // pages render defaults until then. The sync never creates collections.
  collectionsMissing: string[]
}

async function listAll(client: Client, collection: string, locale?: Locale): Promise<Item[]> {
  const items: Item[] = []
  for await (const item of client.listAll(collection, locale ? { locale } : undefined)) items.push(item as Item)
  return items
}

/**
 * Keeps the `pages` inventory and each page's copy collection in step with code:
 *
 * - one `pages` row per route per locale, for every static route on disk and
 *   every route that declares copy; rows whose route is gone are flagged
 *   stale, never deleted;
 * - one published row per declared slot per locale in the manifest's copy
 *   collection (English with the default from code, Spanish empty so it falls
 *   back); label, title, section, number, format and max length follow code,
 *   values are never overwritten, and slots no longer declared are flagged
 *   stale. Copy collections themselves come from `npm run cms:schema`.
 *
 * See openspec/changes/marketing-editing-and-localization/design.md (D9) and
 * openspec/changes/organize-cms-admin-navigation/design.md (D5).
 */
export async function syncStaticPages(options: SyncStaticPagesOptions): Promise<SyncStaticPagesResult> {
  const client = options.client ?? new EmDashClient({ baseUrl: options.baseUrl, token: options.token })
  const manifests = options.manifests ?? []
  const result: SyncStaticPagesResult = {
    created: 0,
    updated: 0,
    markedStale: 0,
    slotsCreated: 0,
    slotsUpdated: 0,
    slotsMarkedStale: 0,
    duplicatesRemoved: 0,
    slotsSkippedForDraft: [],
    collectionsMissing: [],
  }

  await syncPages(client, routesToSync(options.pageFiles, manifests), result)
  await syncSlots(client, manifests, result)
  return result
}

function routesToSync(pageFiles: string[], manifests: ManifestSource[]): StaticPageRoute[] {
  const routes = new Map(staticRoutesFrom(pageFiles).map((r) => [r.routePath, r]))
  for (const { manifest, sourceFile } of manifests) {
    if (manifest.route !== GLOBAL_ROUTE && !routes.has(manifest.route)) {
      routes.set(manifest.route, { routePath: manifest.route, sourceFile })
    }
  }
  return [...routes.values()].sort((a, b) => a.routePath.localeCompare(b.routePath))
}

// Keeps one English row per key (the oldest) and, per other locale, one row
// in that English row's translation group; every other row for the key is
// moved to trash. Returns the kept rows. Rows normally can't be duplicated —
// this heals what overlapping sync runs may have created.
async function dedupe(
  client: Client,
  collection: string,
  byLocale: Map<Locale, Item[]>,
  keyOf: (item: Item) => string,
  result: SyncStaticPagesResult
): Promise<Map<Locale, Item[]>> {
  const oldestFirst = (a: Item, b: Item) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  const keptEnglish = new Map<string, Item>()
  for (const item of [...byLocale.get(DEFAULT_LOCALE)!].sort(oldestFirst)) {
    if (!keptEnglish.has(keyOf(item))) keptEnglish.set(keyOf(item), item)
  }
  const kept = new Map<Locale, Item[]>()
  const discard: Item[] = []
  for (const [locale, items] of byLocale) {
    const keep = new Map<string, Item>()
    for (const item of [...items].sort(oldestFirst)) {
      const key = keyOf(item)
      const english = keptEnglish.get(key)
      const belongs = locale === DEFAULT_LOCALE ? english?.id === item.id : !english || item.translationGroup === english.translationGroup
      if (belongs && !keep.has(key)) keep.set(key, item)
      else discard.push(item)
    }
    kept.set(locale, [...keep.values()])
  }
  for (const item of discard) {
    await client.delete(collection, item.id)
    result.duplicatesRemoved += 1
  }
  return kept
}

async function syncPages(client: Client, routes: StaticPageRoute[], result: SyncStaticPagesResult) {
  const now = new Date().toISOString()
  const byLocale = await dedupe(
    client,
    'pages',
    new Map(await Promise.all(LOCALES.map(async (l) => [l, await listAll(client, 'pages', l)] as const))),
    (item) => String(item.data.route_path),
    result
  )
  const seen = new Set(routes.map((r) => r.routePath))

  for (const route of routes) {
    const data = { route_path: route.routePath, source_file: route.sourceFile, last_synced_at: now, stale: false }
    let englishId: string | undefined
    for (const locale of LOCALES) {
      const match = byLocale.get(locale)!.find((item) => item.data.route_path === route.routePath)
      if (match) {
        await client.update('pages', match.id, { data, _rev: match._rev })
        result.updated += 1
      } else {
        // `pages` has no draft/publish workflow (sync-owned inventory); rows
        // stay in their creation status.
        const created = await client.create('pages', {
          status: 'draft',
          data,
          locale,
          ...(locale !== DEFAULT_LOCALE && englishId ? { translationOf: englishId } : {}),
        })
        result.created += 1
        if (locale === DEFAULT_LOCALE) englishId = created.id
        continue
      }
      if (locale === DEFAULT_LOCALE) englishId = match.id
    }
  }

  for (const items of byLocale.values()) {
    for (const item of items) {
      const routePath = item.data.route_path as string | undefined
      if (routePath && !seen.has(routePath) && item.data.stale !== true) {
        await client.update('pages', item.id, { data: { ...item.data, stale: true }, _rev: item._rev })
        result.markedStale += 1
      }
    }
  }
}

type SlotLayout = { section: string; position: number; title: string }

function slotMeta(key: string, spec: SlotSpec, layout: SlotLayout) {
  return {
    key,
    label: spec.label,
    title: layout.title,
    section: layout.section,
    position: layout.position,
    format: slotFormat(spec),
    max_length: spec.maxLength ?? null,
  }
}

const META_FIELDS = ['label', 'title', 'section', 'position', 'format', 'max_length'] as const

function slotDefault(spec: SlotSpec): Record<string, unknown> {
  switch (slotFormat(spec)) {
    case 'rich':
      return { rich_value: spec.default }
    case 'image':
      return { image_value: { src: spec.default } }
    default:
      return { value: spec.default }
  }
}

const slotId = (route: unknown, key: unknown) => `${route}#${key}`

async function syncSlots(client: Client, manifests: ManifestSource[], result: SyncStaticPagesResult) {
  for (const { manifest } of manifests) {
    const collection = copyCollectionFor(manifest.route) as string
    let listed: Map<Locale, Item[]>
    try {
      listed = new Map(await Promise.all(LOCALES.map(async (l) => [l, await listAll(client, collection, l)] as const)))
    } catch (error) {
      if (error instanceof EmDashApiError && error.status === 404) {
        result.collectionsMissing.push(collection)
        continue
      }
      throw error
    }
    await syncManifestSlots(client, collection, manifest, await dedupe(client, collection, listed, (item) => String(item.data.key), result), result)
  }
}

async function syncManifestSlots(
  client: Client,
  collection: string,
  manifest: CopyManifest,
  byLocale: Map<Locale, Item[]>,
  result: SyncStaticPagesResult
) {
  const english = byLocale.get(DEFAULT_LOCALE)!
  const others = new Map([...byLocale].filter(([l]) => l !== DEFAULT_LOCALE))
  const englishByKey = new Map(english.map((item) => [String(item.data.key), item]))
  const layout = slotLayout(manifest) as Map<string, SlotLayout>

  // Non-translatable fields (key, label, title, section, number, format, max
  // length, stale) are copied to the other locales by EmDash, so metadata is
  // written on the English row only; it's staged as a draft (revisions) and
  // published here, unless an editor already has a draft open on it.
  const writeMeta = async (item: Item, data: Record<string, unknown>) => {
    if (item.draftRevisionId) {
      result.slotsSkippedForDraft.push(slotId(manifest.route, item.data.key))
      return false
    }
    await client.update(collection, item.id, { data, _rev: item._rev })
    await client.publish(collection, item.id)
    return true
  }

  for (const [key, spec] of Object.entries(manifest.slots)) {
    const meta = slotMeta(key, spec, layout.get(key)!)
    let en = englishByKey.get(key)

    if (!en) {
      en = await client.create(collection, { status: 'draft', locale: DEFAULT_LOCALE, data: { ...meta, ...slotDefault(spec), stale: false } })
      await client.publish(collection, en.id)
      result.slotsCreated += 1
    } else {
      const changed = META_FIELDS.some((f) => (en!.data[f] ?? null) !== meta[f]) || en.data.stale === true
      if (changed && (await writeMeta(en, { ...meta, stale: false }))) result.slotsUpdated += 1
    }

    for (const [locale, items] of others) {
      const hasTranslation = items.some((item) => item.translationGroup === en!.translationGroup || item.data.key === key)
      if (hasTranslation) continue
      const created = await client.create(collection, {
        status: 'draft',
        locale,
        translationOf: en.id,
        data: { ...meta, stale: false },
      })
      await client.publish(collection, created.id)
      result.slotsCreated += 1
    }
  }

  for (const item of english) {
    if (String(item.data.key) in manifest.slots || item.data.stale === true) continue
    if (await writeMeta(item, { stale: true })) result.slotsMarkedStale += 1
  }
}

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { EmDashClient } from 'emdash/client'
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

export function scanStaticPageRoutes(pagesDir: string): StaticPageRoute[] {
  const entries = readdirSync(pagesDir, { recursive: true }) as string[]
  const relPaths = entries.map((entry) => entry.split(/[\\/]/).join('/'))

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
  rootDir: string
): ManifestSource[] {
  return Object.entries(modules).flatMap(([modulePath, mod]) => {
    const rel = modulePath.replace(/^\//, '')
    const manifests = Array.isArray(mod.default) ? mod.default : [mod.default]
    return manifests.map((manifest) => ({ manifest, sourceFile: pageFileNextTo(rel, rootDir) }))
  })
}

// The page a manifest belongs to: for `_copy.detail.ts` the directory's
// dynamic template ([slug].astro); for `_copy.ts` its index.astro, else the
// directory's only other page (e.g. [category].astro); else the manifest
// itself (site-wide copy).
function pageFileNextTo(relManifest: string, rootDir: string): string {
  const dir = path.posix.dirname(relManifest)
  const abs = path.join(rootDir, dir)
  if (relManifest.endsWith('_copy.detail.ts')) {
    const template = existsSync(abs) ? readdirSync(abs).find((f) => f.startsWith('[') && f.endsWith('.astro')) : undefined
    return template ? `${dir}/${template}` : relManifest
  }
  if (existsSync(path.join(abs, 'index.astro'))) return `${dir}/index.astro`
  const page = existsSync(abs) ? readdirSync(abs).find((f) => f.endsWith('.astro')) : undefined
  return page ? `${dir}/${page}` : relManifest
}

// The subset of EmDashClient the sync uses (injectable for tests).
type Client = Pick<EmDashClient, 'listAll' | 'create' | 'update' | 'publish' | 'delete'>
type Item = Awaited<ReturnType<Client['create']>>

export interface SyncStaticPagesOptions {
  baseUrl: string
  token: string
  pagesDir: string
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
}

async function listAll(client: Client, collection: string, locale?: Locale): Promise<Item[]> {
  const items: Item[] = []
  for await (const item of client.listAll(collection, locale ? { locale } : undefined)) items.push(item as Item)
  return items
}

/**
 * Keeps the `pages` inventory and the `page_copy` slots in step with code:
 *
 * - one `pages` row per route per locale, for every static route on disk and
 *   every route that declares copy; rows whose route is gone are flagged
 *   stale, never deleted;
 * - one published `page_copy` row per declared slot per locale (English with
 *   the default from code, Spanish empty so it falls back); label, format and
 *   max length follow code, values are never overwritten, and slots no longer
 *   declared are flagged stale.
 *
 * See openspec/changes/marketing-editing-and-localization/design.md (D9).
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
  }

  await syncPages(client, routesToSync(options.pagesDir, manifests), result)
  await syncSlots(client, manifests, result)
  return result
}

function routesToSync(pagesDir: string, manifests: ManifestSource[]): StaticPageRoute[] {
  const routes = new Map(scanStaticPageRoutes(pagesDir).map((r) => [r.routePath, r]))
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

function slotMeta(route: string, key: string, spec: SlotSpec) {
  return {
    route_path: route,
    key,
    label: spec.label,
    format: slotFormat(spec),
    max_length: spec.maxLength ?? null,
  }
}

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
  const byLocale = await dedupe(
    client,
    'page_copy',
    new Map(await Promise.all(LOCALES.map(async (l) => [l, await listAll(client, 'page_copy', l)] as const))),
    (item) => slotId(item.data.route_path, item.data.key),
    result
  )
  const english = byLocale.get(DEFAULT_LOCALE)!
  const others = new Map([...byLocale].filter(([l]) => l !== DEFAULT_LOCALE))
  const englishBySlot = new Map(english.map((item) => [slotId(item.data.route_path, item.data.key), item]))
  const declared = new Set<string>()

  // Non-translatable fields (route, key, label, format, max length, stale) are
  // copied to the other locales by EmDash, so metadata is written on the
  // English row only; it's staged as a draft (revisions) and published here,
  // unless an editor already has a draft open on it.
  const writeMeta = async (item: Item, data: Record<string, unknown>) => {
    if (item.draftRevisionId) {
      result.slotsSkippedForDraft.push(slotId(item.data.route_path, item.data.key))
      return false
    }
    await client.update('page_copy', item.id, { data, _rev: item._rev })
    await client.publish('page_copy', item.id)
    return true
  }

  for (const { manifest } of manifests) {
    for (const [key, spec] of Object.entries(manifest.slots)) {
      const id = slotId(manifest.route, key)
      declared.add(id)
      const meta = slotMeta(manifest.route, key, spec)
      let en = englishBySlot.get(id)

      if (!en) {
        en = await client.create('page_copy', { status: 'draft', locale: DEFAULT_LOCALE, data: { ...meta, ...slotDefault(spec), stale: false } })
        await client.publish('page_copy', en.id)
        result.slotsCreated += 1
      } else {
        const changed =
          en.data.label !== meta.label ||
          en.data.format !== meta.format ||
          (en.data.max_length ?? null) !== meta.max_length ||
          en.data.stale === true
        if (changed && (await writeMeta(en, { ...meta, stale: false }))) result.slotsUpdated += 1
      }

      for (const [locale, items] of others) {
        const hasTranslation = items.some((item) => item.translationGroup === en!.translationGroup || slotId(item.data.route_path, item.data.key) === id)
        if (hasTranslation) continue
        const created = await client.create('page_copy', {
          status: 'draft',
          locale,
          translationOf: en.id,
          data: { ...meta, stale: false },
        })
        await client.publish('page_copy', created.id)
        result.slotsCreated += 1
      }
    }
  }

  for (const item of english) {
    if (declared.has(slotId(item.data.route_path, item.data.key)) || item.data.stale === true) continue
    if (await writeMeta(item, { stale: true })) result.slotsMarkedStale += 1
  }
}

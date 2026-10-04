import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { manifestSources, scanStaticPageRoutes, syncStaticPages } from './staticPageSync'
import { defineCopy, GLOBAL_ROUTE } from './copy'

const PAGES_DIR = path.join(process.cwd(), 'src/pages')

describe('scanStaticPageRoutes', () => {
  it('returns exactly the static, non-collection-backed routes', () => {
    const routes = scanStaticPageRoutes(PAGES_DIR).map((r) => r.routePath)

    expect(routes).toEqual([
      '/',
      '/contact',
      '/corporate-sponsorships',
      '/earthquake-relief',
      '/privacy-policy',
      '/sponsor-a-child',
      '/ways-to-give',
    ])
  })

  it('excludes collection-detail and collection-index routes', () => {
    const routes = scanStaticPageRoutes(PAGES_DIR).map((r) => r.routePath)

    expect(routes).not.toContain('/blog')
    expect(routes).not.toContain('/events')
    expect(routes).not.toContain('/our-team')
    expect(routes).not.toContain('/sponsor-a-child/children')
    expect(routes).not.toContain('/resources')
    expect(routes.some((r) => r.includes('['))).toBe(false)
  })

  it('records the source file alongside each route', () => {
    const routes = scanStaticPageRoutes(PAGES_DIR)
    const contact = routes.find((r) => r.routePath === '/contact')

    expect(contact?.sourceFile).toBe('src/pages/contact/index.astro')
  })
})

// --- syncStaticPages, against an in-memory EmDash ----------------------------

interface FakeItem {
  id: string
  createdAt: string
  collection: string
  locale: string
  translationGroup: string
  status: string
  draftRevisionId: string | null
  data: Record<string, unknown>
  _rev: string
}

function fakeEmDash() {
  const items: FakeItem[] = []
  const calls: string[] = []
  let next = 1
  const find = (id: string) => items.find((i) => i.id === id)!
  const client = {
    async *listAll(collection: string, options?: { locale?: string }) {
      for (const i of items.filter((x) => x.collection === collection && (!options?.locale || x.locale === options.locale))) {
        yield structuredClone(i) as never
      }
    },
    async create(collection: string, input: { data: Record<string, unknown>; status?: string; locale?: string; translationOf?: string }) {
      const id = `id${next++}`
      const item: FakeItem = {
        id,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, next)).toISOString(),
        collection,
        locale: input.locale ?? 'en',
        translationGroup: input.translationOf ? find(input.translationOf).translationGroup : id,
        status: input.status ?? 'draft',
        draftRevisionId: null,
        data: { ...input.data },
        _rev: 'r1',
      }
      items.push(item)
      calls.push(`create ${collection} ${item.locale}`)
      return structuredClone(item) as never
    },
    async update(collection: string, id: string, input: { data?: Record<string, unknown> }) {
      Object.assign(find(id).data, input.data)
      calls.push(`update ${collection} ${id}`)
      return structuredClone(find(id)) as never
    },
    async delete(collection: string, id: string) {
      items.splice(items.indexOf(find(id)), 1)
      calls.push(`delete ${collection} ${id}`)
    },
    async publish(collection: string, id: string) {
      find(id).status = 'published'
      calls.push(`publish ${collection} ${id}`)
    },
  }
  return { client: client as never, items, calls }
}

const pagesDir = PAGES_DIR

function copyFor(route: string, maxLength = 80) {
  return {
    manifest: defineCopy(route, {
      'hero.heading': { label: 'Hero heading', default: 'Ways to give', maxLength },
      'seo.image': { label: 'Share image', format: 'image', default: '/images/og.jpg' },
    }),
    sourceFile: 'src/pages/x/index.astro',
  }
}

describe('syncStaticPages', () => {
  const opts = { baseUrl: 'http://x', token: 't', pagesDir }

  it('creates one pages row per route per locale, linking translations', async () => {
    const db = fakeEmDash()
    const result = await syncStaticPages({ ...opts, client: db.client })

    const pages = db.items.filter((i) => i.collection === 'pages')
    expect(result.created).toBe(14)
    expect(pages.filter((p) => p.locale === 'en')).toHaveLength(7)
    const contactEn = pages.find((p) => p.locale === 'en' && p.data.route_path === '/contact')!
    const contactEs = pages.find((p) => p.locale === 'es' && p.data.route_path === '/contact')!
    expect(contactEs.translationGroup).toBe(contactEn.translationGroup)
    expect(contactEn.data).toMatchObject({ source_file: 'src/pages/contact/index.astro', stale: false })
  })

  it('updates existing rows on re-sync without duplicating them', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client })
    const result = await syncStaticPages({ ...opts, client: db.client })

    expect(result).toMatchObject({ created: 0, updated: 14 })
    expect(db.items.filter((i) => i.collection === 'pages')).toHaveLength(14)
  })

  it('inventories listing routes that declare copy', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/events')] })

    const events = db.items.filter((i) => i.collection === 'pages' && i.data.route_path === '/events')
    expect(events.map((e) => e.locale).sort()).toEqual(['en', 'es'])
  })

  it('flags pages whose route is gone as stale, without deleting them', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/events')] })
    const result = await syncStaticPages({ ...opts, client: db.client })

    expect(result.markedStale).toBe(2)
    expect(db.items.filter((i) => i.data.route_path === '/events' && i.collection === 'pages').every((i) => i.data.stale)).toBe(true)
  })

  it('creates a published English slot with its default and an empty published Spanish slot', async () => {
    const db = fakeEmDash()
    const result = await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })

    const slots = db.items.filter((i) => i.collection === 'page_copy' && i.data.key === 'hero.heading')
    const en = slots.find((s) => s.locale === 'en')!
    const es = slots.find((s) => s.locale === 'es')!
    expect(result.slotsCreated).toBe(4)
    expect(en).toMatchObject({ status: 'published', data: { value: 'Ways to give', label: 'Hero heading', format: 'plain', max_length: 80 } })
    expect(es.status).toBe('published')
    expect(es.data.value).toBeUndefined()
    expect(es.translationGroup).toBe(en.translationGroup)
    const image = db.items.find((i) => i.data.key === 'seo.image' && i.locale === 'en')!
    expect(image.data).toMatchObject({ format: 'image', image_value: { src: '/images/og.jpg' } })
  })

  it('does nothing to slots when code and CMS already agree', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })
    db.calls.length = 0
    const result = await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })

    expect(result).toMatchObject({ slotsCreated: 0, slotsUpdated: 0, slotsMarkedStale: 0 })
    expect(db.calls.filter((c) => c.includes('page_copy'))).toEqual([])
  })

  it('updates a changed max length from code, keeps the value, and publishes', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give', 80)] })
    const en = db.items.find((i) => i.data.key === 'hero.heading' && i.locale === 'en')!
    en.data.value = 'Edited by marketing'
    const result = await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give', 120)] })

    expect(result.slotsUpdated).toBe(1)
    expect(en.data).toMatchObject({ max_length: 120, value: 'Edited by marketing' })
    expect(db.calls.at(-1)).toBe(`publish page_copy ${en.id}`)
  })

  it('never publishes over an editor draft: the slot is skipped and reported', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give', 80)] })
    const en = db.items.find((i) => i.data.key === 'hero.heading' && i.locale === 'en')!
    en.draftRevisionId = 'draft-1'
    db.calls.length = 0
    const result = await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give', 120)] })

    expect(result.slotsSkippedForDraft).toEqual(['/ways-to-give#hero.heading'])
    expect(en.data.max_length).toBe(80)
    expect(db.calls.some((c) => c.includes(en.id))).toBe(false)
  })

  it('flags slots no longer declared as stale and keeps them', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })
    const result = await syncStaticPages({
      ...opts,
      client: db.client,
      manifests: [{ manifest: defineCopy('/ways-to-give', { 'hero.heading': { label: 'Hero heading', default: 'x', maxLength: 80 } }), sourceFile: 'x' }],
    })

    expect(result.slotsMarkedStale).toBe(1)
    expect(db.items.find((i) => i.data.key === 'seo.image' && i.locale === 'en')!.data.stale).toBe(true)
  })

  it('does not inventory site-wide copy as a page', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor(GLOBAL_ROUTE)] })
    expect(db.items.some((i) => i.collection === 'pages' && i.data.route_path === GLOBAL_ROUTE)).toBe(false)
  })
})

describe('syncStaticPages: overlapping runs', () => {
  const opts = { baseUrl: 'http://x', token: 't', pagesDir }

  it('heals duplicate slots, keeping the oldest row and its translation', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })
    const original = db.items.find((i) => i.data.key === 'hero.heading' && i.locale === 'en')!
    original.data.value = 'Edited by marketing'
    // Simulate a second, overlapping run that created its own copies.
    const dupEn = await db.client.create('page_copy', { status: 'draft', locale: 'en', data: { ...original.data, value: 'Ways to give' } })
    await db.client.create('page_copy', { status: 'draft', locale: 'es', translationOf: (dupEn as { id: string }).id, data: { route_path: '/ways-to-give', key: 'hero.heading' } })

    const result = await syncStaticPages({ ...opts, client: db.client, manifests: [copyFor('/ways-to-give')] })

    const slots = db.items.filter((i) => i.data.key === 'hero.heading')
    expect(result.duplicatesRemoved).toBe(2)
    expect(slots).toHaveLength(2)
    expect(slots.find((i) => i.locale === 'en')!.data.value).toBe('Edited by marketing')
    expect(slots.find((i) => i.locale === 'es')!.translationGroup).toBe(original.translationGroup)
  })

  it('heals duplicate pages rows the same way', async () => {
    const db = fakeEmDash()
    await syncStaticPages({ ...opts, client: db.client })
    await db.client.create('pages', { status: 'draft', locale: 'en', data: { route_path: '/contact' } })
    const result = await syncStaticPages({ ...opts, client: db.client })
    expect(result.duplicatesRemoved).toBe(1)
    expect(db.items.filter((i) => i.collection === 'pages' && i.data.route_path === '/contact')).toHaveLength(2)
  })
})

describe('manifestSources', () => {
  it('maps each manifest module to the page next to it', () => {
    const manifest = defineCopy('/contact', { 'hero.heading': { label: 'Heading', default: 'Contact' } })
    const cat = (route: string) => defineCopy(route, { 'hero.heading': { label: 'Heading', default: 'x' } })
    const sources = manifestSources(
      {
        '/src/pages/contact/_copy.ts': { default: manifest },
        '/src/pages/resources/category/_copy.ts': { default: [cat('/resources/category/stories'), cat('/resources/category/financials-transparency')] },
        '/src/pages/events/_copy.detail.ts': { default: cat('/events/*') },
      },
      process.cwd()
    )
    expect(sources.map((s) => [s.manifest.route, s.sourceFile])).toEqual([
      ['/contact', 'src/pages/contact/index.astro'],
      ['/resources/category/stories', 'src/pages/resources/category/[category].astro'],
      ['/resources/category/financials-transparency', 'src/pages/resources/category/[category].astro'],
      ['/events/*', 'src/pages/events/[slug].astro'],
    ])
  })
})

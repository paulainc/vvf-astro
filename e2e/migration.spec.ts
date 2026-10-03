import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// English paths from the live sitemap, saved by `npm run migrate:extract`.
const sitemap: string[] = JSON.parse(readFileSync(new URL('../scripts/migrate/snapshot/sitemap.json', import.meta.url), 'utf-8')).urls
// Child pages only resolve where the (gitignored) child data was seeded.
const hasChildren = existsSync(new URL('../seed/seed.local.json', import.meta.url))
const paths = sitemap.filter((p) => hasChildren || !p.startsWith('/children/'))

test.describe('legacy Webflow URLs', () => {
  test('redirect permanently to project routes', async ({ request }) => {
    for (const [from, to] of [
      ['/team-members/randy-lander', '/our-team/randy-lander'],
      ['/venezuela-earthquake-relief', '/earthquake-relief'],
      ['/all-events', '/events'],
      ['/resources-categories/all', '/resources'],
      ['/resources-categories/stories', '/resources/category/stories'],
    ]) {
      const response = await request.get(from, { maxRedirects: 0 })
      expect(response.status(), from).toBe(301)
      expect(new URL(response.headers().location, 'http://x').pathname, from).toBe(to)
    }
  })

  test('every English sitemap URL returns 200 directly or after a single 301', async ({ request }) => {
    const failures: string[] = []
    for (const path of paths) {
      const first = await request.get(path, { maxRedirects: 0 })
      let status = first.status()
      if (status === 301) {
        const target = new URL(first.headers().location, 'http://x').pathname
        status = (await request.get(target, { maxRedirects: 0 })).status()
        if (status !== 200) failures.push(`${path} → ${target} (${status})`)
      } else if (status !== 200) {
        failures.push(`${path} (${status})`)
      }
    }
    expect(failures).toEqual([])
  })
})

test('no page references Webflow or shows staging-only elements', async ({ request }) => {
  const failures: string[] = []
  for (const path of paths) {
    const html = await (await request.get(path)).text()
    if (/website-files\.com|webflow\.com/.test(html)) failures.push(`${path}: Webflow URL`)
    if (html.includes('Missing SEO fields')) failures.push(`${path}: staging SEO bar`)
  }
  expect(failures).toEqual([])
})

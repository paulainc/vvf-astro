import { defineMiddleware } from 'astro:middleware'
import { after } from 'emdash'
import { syncStaticPages } from './lib/staticPageSync'

// Runs once per process, on the first request - covers `astro dev` and the
// deployed `@astrojs/node` standalone server uniformly, since neither has a
// build-time hook with a live server to sync against (see
// openspec/changes/expose-static-pages-to-emdash/design.md).
let hasSynced = false

export const onRequest = defineMiddleware((context, next) => {
  if (!hasSynced) {
    hasSynced = true
    const token = import.meta.env.EMDASH_SYNC_PAT

    if (token) {
      after(async () => {
        const result = await syncStaticPages({
          baseUrl: context.url.origin,
          token,
          pagesDir: `${process.cwd()}/src/pages`,
        })
        console.log('[static-page-sync]', result)
      })
    } else {
      console.warn('[static-page-sync] EMDASH_SYNC_PAT not set, skipping sync')
    }
  }

  return next()
})

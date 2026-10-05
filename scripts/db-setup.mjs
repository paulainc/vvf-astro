#!/usr/bin/env node
// `npm run db:setup` (and `npm run seed` in Postgres mode): prepare a Postgres
// database for the site (openspec/changes/make-app-portable, design D6).
// 1. Apply EmDash's migrations (`emdash migrate`, reads DATABASE_URL).
// 2. Upload the public seed media (seed/media/manifest.json, never child
//    media) to the configured storage and create its media rows
//    (scripts/lib/seed-media.mjs; openspec/changes/seed-postgres-with-media).
// 3. Seed the public seed/seed.json (no child data).
// Steps 2-3 run only into an empty database; existing content is never
// re-seeded unless --force. With --no-seed, stop after migrations (a target
// for npm run data:import).
// Needs DB_ADAPTER=postgres and DATABASE_URL; STORAGE=s3 (with S3_*) uploads
// media to the bucket, otherwise to ./uploads.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { Kysely, sql } from 'kysely'
import { applySeed } from 'emdash/seed'
import { createStorage as createLocalStorage } from 'emdash/storage/local'
import { createStorage as createS3Storage } from 'emdash/storage/s3'
import { readManifests, seedMedia } from './lib/seed-media.mjs'
import { createDialect } from '../src/lib/db/postgresRuntime.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

// The same choice as the site's (astro.config.mjs).
export function openStorage(env = process.env) {
  return env.STORAGE === 's3'
    ? createS3Storage({})
    : createLocalStorage({ directory: path.join(ROOT, 'uploads'), baseUrl: '/_emdash/api/media/file' })
}

export const shouldSeed = (collectionCount, force = false) => force || collectionCount === 0

function emdashMigrate() {
  // The CLI reports on stderr; read both streams.
  const run = (args) => {
    const r = spawnSync('npx', ['emdash', 'migrate', '--from-config', ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, DB_ADAPTER: 'postgres' } })
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
    if (r.status !== 0) throw new Error(`emdash migrate failed:\n${out}`)
    return out
  }
  const fingerprint = run(['--status']).match(/Target fingerprint: (\S+)/)?.[1]
  if (!fingerprint) throw new Error('Could not read the migration target fingerprint from `emdash migrate --status`.')
  const out = run([`--expected-target-fingerprint=${fingerprint}`])
  return out.match(/Executed: (.*)/)?.[1]?.trim() ?? ''
}

export async function setupDatabase({ seedFile = path.join(ROOT, 'seed/seed.json'), force = false, seed = true, storage, log = console.log } = {}) {
  const executed = emdashMigrate()
  log(`Migrations: ${executed && executed !== 'none' ? executed.split(',').length + ' applied' : 'up to date'}`)
  if (!seed) return { seeded: false } // --no-seed: an empty, migrated database (e.g. for npm run data:import)
  const db = new Kysely({ dialect: createDialect() })
  try {
    const { rows } = await sql`select count(*)::int as n from _emdash_collections`.execute(db)
    if (!shouldSeed(rows[0].n, force)) {
      log(`Seed skipped: the database already has ${rows[0].n} collections (use --force to re-apply).`)
      return { seeded: false }
    }
    const media = await seedMedia({ db, storage: storage ?? openStorage(), manifest: readManifests({ children: false }).public, force })
    log(`Media: ${media.uploaded} uploaded, ${media.skipped} already present.`)
    const result = await applySeed(db, JSON.parse(readFileSync(seedFile, 'utf8')), { includeContent: true })
    log(`Seeded ${path.relative(ROOT, seedFile)}: ${result.collections.created} collections, ${result.content.created} entries, ${result.menus.created} menus.`)
    return { seeded: true, result, media }
  } finally {
    await db.destroy()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const seedArg = process.argv.find((a) => a.startsWith('--seed='))?.slice('--seed='.length)
  await setupDatabase({ seedFile: seedArg ? path.resolve(seedArg) : undefined, force: process.argv.includes('--force'), seed: !process.argv.includes('--no-seed') })
}

import { describe, expect, it } from 'vitest'
import { shouldSeed } from './db-setup.mjs'

describe('shouldSeed', () => {
  it('seeds only an empty database unless forced', () => {
    expect(shouldSeed(0)).toBe(true)
    expect(shouldSeed(33)).toBe(false)
    expect(shouldSeed(33, true)).toBe(true)
  })
})

// Review finding (PR #25): seeding Postgres didn't say where it was writing.
describe('describeTarget', () => {
  it('names host, port and database without credentials', async () => {
    const { describeTarget } = await import('./db-setup.mjs')
    expect(describeTarget('postgres://vvf:secret@db.example.org:5432/vvf')).toBe('db.example.org:5432/vvf')
    expect(describeTarget('not a url')).toBe('(unparseable DATABASE_URL)')
  })
})

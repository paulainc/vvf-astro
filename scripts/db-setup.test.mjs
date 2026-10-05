import { describe, expect, it } from 'vitest'
import { shouldSeed } from './db-setup.mjs'

describe('shouldSeed', () => {
  it('seeds only an empty database unless forced', () => {
    expect(shouldSeed(0)).toBe(true)
    expect(shouldSeed(33)).toBe(false)
    expect(shouldSeed(33, true)).toBe(true)
  })
})

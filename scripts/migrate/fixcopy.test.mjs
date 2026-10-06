import { describe, expect, it, vi } from 'vitest'
import { fixCopy } from './fixcopy.mjs'

function fakeClient(rows) {
  return {
    listAll: async function* () {
      yield* rows
    },
    update: vi.fn(async () => ({})),
    publish: vi.fn(async () => ({})),
  }
}
const row = (key, value, extra = {}) => ({ id: key, _rev: 'r', data: { key, value }, ...extra })
const corrections = [
  ['_global', 'a', 'wrong', 'right'],
  ['_global', 'b', 'wrong', 'right'],
  ['_global', 'c', 'wrong', 'right'],
  ['_global', 'd', 'wrong', 'right'],
  ['_global', 'e', 'wrong', 'right'],
  ['_global', 'f', 'wrong', 'right'],
]

describe('fixCopy', () => {
  const rows = [row('a', 'wrong'), row('b', 'right'), row('c', 'an editor wrote this'), row('d', 'wrong', { draftRevisionId: 'x' }), row('f', '')]

  it('only reports without --apply', async () => {
    const client = fakeClient(rows)
    const r = await fixCopy({ apply: false, client, corrections, log: () => {} })
    expect(r.fixed).toHaveLength(2)
    expect(client.update).not.toHaveBeenCalled()
  })

  it('fixes exact wrong values and empty slots only, and leaves edits, drafts and missing rows alone', async () => {
    const client = fakeClient(rows)
    const r = await fixCopy({ apply: true, client, corrections, log: () => {} })
    expect(client.update).toHaveBeenCalledTimes(2)
    expect(client.update).toHaveBeenCalledWith('copy_site', 'a', { data: { value: 'right' }, _rev: 'r' })
    expect(client.publish).toHaveBeenCalledWith('copy_site', 'a')
    expect([r.alreadyRight, r.edited.length, r.draft, r.missing]).toEqual([['_global b'], 1, ['_global d'], ['_global e']])
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { APIContext } from 'astro'

vi.mock('astro:env/server', () => ({ SAFEGUARDING_USERS: '' }))
const { guardEmDashApi } = await import('./emdashGuard')

const editor = { id: 'u1', email: 'editor@example.org', role: 40 }
const call = (path: string, headers: Record<string, string> = {}, user?: unknown) => {
  const url = new URL(`http://localhost${path}`)
  const context = { url, request: new Request(url, { headers }), locals: { user } } as unknown as APIContext
  return guardEmDashApi(context, async () => new Response('next'))
}

describe('database snapshot', () => {
  it('is refused without a preview signature', async () => {
    expect((await call('/_emdash/api/snapshot'))?.status).toBe(403)
  })

  it('is refused with a forged preview signature (EmDash would fall back to the Editor session)', async () => {
    const res = await call('/_emdash/api/snapshot?drafts=true', { 'X-Preview-Signature': 'x' })
    expect(res?.status).toBe(403)
  })

  it('is refused to signed-in users too', async () => {
    expect((await call('/_emdash/api/snapshot', {}, editor))?.status).toBe(403)
  })
})

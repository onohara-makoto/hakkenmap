// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  handleIdentify,
  IdentifyUpstreamError,
  parseIdentifyResults,
  type IdentifyDeps,
} from '@/app/lib/identify/handler'
import { IDENTIFY_MAX_BYTES, sniffImageType } from '@/app/lib/identify/image'
import { requestIdentify } from '@/app/lib/identify/client'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46])
const HEIC = new Uint8Array([0, 0, 0, 0x18, ...new TextEncoder().encode('ftypheic'), 0, 0])
const GEMINI_JSON = JSON.stringify([
  { commonName: 'ヒマワリ', scientificName: 'Helianthus annuus', confidence: 0.92 },
])

function deps(overrides: Partial<IdentifyDeps> = {}): IdentifyDeps {
  return {
    apiKeyConfigured: true,
    getUserId: vi.fn(async () => 'user-1'),
    consumeQuota: vi.fn(async () => 'ok' as const),
    identify: vi.fn(async () => GEMINI_JSON),
    ...overrides,
  }
}

function imageRequest(bytes: Uint8Array, type = 'image/jpeg', headers: HeadersInit = {}) {
  const form = new FormData()
  form.append('image', new Blob([bytes as Uint8Array<ArrayBuffer>], { type }), 'photo.jpg')
  return new Request('http://localhost/api/identify', { method: 'POST', body: form, headers })
}

async function call(req: Request, d: IdentifyDeps) {
  const res = await handleIdentify(req, d)
  return { status: res.status, body: await res.json() }
}

describe('POST /api/identify', () => {
  it('returns 401 for unauthenticated users without reading quota or calling Gemini', async () => {
    const d = deps({ getUserId: vi.fn(async () => null) })
    const { status, body } = await call(imageRequest(JPEG), d)
    expect(status).toBe(401)
    expect(body.code).toBe('unauthenticated')
    expect(d.consumeQuota).not.toHaveBeenCalled()
    expect(d.identify).not.toHaveBeenCalled()
  })

  it('returns 400 when the body is not multipart', async () => {
    const req = new Request('http://localhost/api/identify', { method: 'POST', body: 'hello' })
    const { status, body } = await call(req, deps())
    expect(status).toBe(400)
    expect(body.code).toBe('invalid_image')
  })

  it('returns 400 when no image is attached', async () => {
    const req = new Request('http://localhost/api/identify', { method: 'POST', body: new FormData() })
    expect((await call(req, deps())).status).toBe(400)
  })

  it('returns 400 for a non-image file even if it claims to be a JPEG, and does not use quota', async () => {
    const d = deps()
    const fake = new TextEncoder().encode('<html>not an image</html>')
    const { status, body } = await call(imageRequest(fake, 'image/jpeg'), d)
    expect(status).toBe(400)
    expect(body.code).toBe('invalid_image')
    expect(d.consumeQuota).not.toHaveBeenCalled()
  })

  it('returns 413 when the image exceeds the size limit', async () => {
    const big = new Uint8Array(IDENTIFY_MAX_BYTES + 1)
    big.set(JPEG)
    const { status, body } = await call(imageRequest(big), deps())
    expect(status).toBe(413)
    expect(body.code).toBe('image_too_large')
  })

  it('returns 413 from Content-Length before reading the body', async () => {
    const req = new Request('http://localhost/api/identify', {
      method: 'POST',
      body: 'x',
      headers: { 'content-length': String(IDENTIFY_MAX_BYTES * 2) },
    })
    const { status } = await call(req, deps())
    expect(status).toBe(413)
  })

  it('returns 429 with Retry-After when the daily limit is reached', async () => {
    const d = deps({ consumeQuota: vi.fn(async () => 'limited' as const) })
    const res = await handleIdentify(imageRequest(JPEG), d)
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBeTruthy()
    expect((await res.json()).code).toBe('rate_limited')
    expect(d.identify).not.toHaveBeenCalled()
  })

  it('returns 503 when Gemini is overloaded or times out', async () => {
    for (const status of [503, 429, null]) {
      const d = deps({ identify: vi.fn(async () => { throw new IdentifyUpstreamError('boom', status) }) })
      const res = await call(imageRequest(JPEG), d)
      expect(res.status).toBe(503)
      expect(res.body.code).toBe('ai_unavailable')
    }
  })

  it('returns 502 when Gemini rejects the request or returns unparsable text', async () => {
    const rejected = deps({ identify: vi.fn(async () => { throw new IdentifyUpstreamError('bad', 400) }) })
    expect((await call(imageRequest(JPEG), rejected)).status).toBe(502)
    const garbage = deps({ identify: vi.fn(async () => 'sorry, I cannot help') })
    expect((await call(imageRequest(JPEG), garbage)).body.code).toBe('ai_error')
  })

  it('returns 500 without using quota or Gemini when the API key is missing', async () => {
    const d = deps({ apiKeyConfigured: false })
    expect((await call(imageRequest(JPEG), d)).status).toBe(500)
    expect(d.consumeQuota).not.toHaveBeenCalled()
    expect(d.identify).not.toHaveBeenCalled()
  })

  it('still returns 401 to signed-out users when the API key is missing', async () => {
    const d = deps({ apiKeyConfigured: false, getUserId: vi.fn(async () => null) })
    expect((await call(imageRequest(JPEG), d)).status).toBe(401)
  })

  it('succeeds on retry after a Gemini outage', async () => {
    const identify = vi
      .fn<IdentifyDeps['identify']>()
      .mockRejectedValueOnce(new IdentifyUpstreamError('unavailable', 503))
      .mockResolvedValueOnce(GEMINI_JSON)
    const d = deps({ identify })
    expect((await call(imageRequest(JPEG), d)).status).toBe(503)
    const retry = await call(imageRequest(JPEG), d)
    expect(retry.status).toBe(200)
    expect(retry.body.results).toEqual([{ name: 'Helianthus annuus', commonName: 'ヒマワリ', score: 0.92 }])
  })

  it('sends the sniffed MIME type to Gemini, not the one the client declared', async () => {
    const d = deps()
    await call(imageRequest(PNG, 'image/jpeg'), d)
    expect(d.identify).toHaveBeenCalledWith(expect.objectContaining({ mimeType: 'image/png' }))
  })
})

describe('sniffImageType', () => {
  it('recognises supported formats by magic bytes', () => {
    expect(sniffImageType(JPEG)).toBe('image/jpeg')
    expect(sniffImageType(PNG)).toBe('image/png')
    expect(sniffImageType(HEIC)).toBe('image/heic')
    expect(sniffImageType(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(sniffImageType(new TextEncoder().encode('GIF89a......'))).toBeNull()
  })
})

describe('parseIdentifyResults', () => {
  it('drops malformed entries and clamps scores', () => {
    const text = 'here you go: [{"commonName":"A","confidence":3},{"foo":1},null,{"scientificName":"B"}]'
    expect(parseIdentifyResults(text)).toEqual([
      { name: '', commonName: 'A', score: 1 },
      { name: 'B', commonName: null, score: 0 },
    ])
  })
})

describe('requestIdentify (client)', () => {
  const image = new Blob([JPEG], { type: 'image/jpeg' })

  it('maps an HTML 413 from the reverse proxy to a size message', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>413 Request Entity Too Large</html>', { status: 413 }))
    const out = await requestIdentify(image, fetchImpl as unknown as typeof fetch)
    expect(out).toMatchObject({ ok: false, code: 'image_too_large' })
  })

  it('reports network failures without throwing', async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError('Failed to fetch') })
    const out = await requestIdentify(image, fetchImpl as unknown as typeof fetch)
    expect(out).toMatchObject({ ok: false, code: 'network' })
  })

  it('uses the error code from the API response', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ code: 'rate_limited', error: 'x' }, { status: 429 }))
    const out = await requestIdentify(image, fetchImpl as unknown as typeof fetch)
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.message).toContain('上限')
  })

  it('refuses to send images over the limit', async () => {
    const fetchImpl = vi.fn()
    const out = await requestIdentify(new Blob([new Uint8Array(IDENTIFY_MAX_BYTES + 1)]), fetchImpl as unknown as typeof fetch)
    expect(out).toMatchObject({ ok: false, code: 'image_too_large' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

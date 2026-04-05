import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EstimationsGraph } from './estimations-graph'
import {
  buildShareUrl,
  decodeSharePayload,
  encodeSharePayload,
  isShareSupported,
  isShareUrlTooLarge,
  MAX_SHARE_URL_LENGTH,
} from './share-url'

class PassthroughCompressionStream {
  readonly readable: ReadableStream<Uint8Array>
  readonly writable: WritableStream<Uint8Array>

  constructor(_format: 'gzip') {
    const transformer = new TransformStream<Uint8Array, Uint8Array>()
    this.readable = transformer.readable
    this.writable = transformer.writable
  }
}

const originalCompressionStream = globalThis.CompressionStream
const originalDecompressionStream = globalThis.DecompressionStream

describe('share-url', () => {
  beforeAll(() => {
    globalThis.CompressionStream = PassthroughCompressionStream as typeof CompressionStream
    globalThis.DecompressionStream = PassthroughCompressionStream as typeof DecompressionStream
  })

  afterAll(() => {
    globalThis.CompressionStream = originalCompressionStream
    globalThis.DecompressionStream = originalDecompressionStream
  })

  it('round-trips a project through the share payload codec', async () => {
    const state: EstimationsGraph.GraphState = {
      ...EstimationsGraph.createInitialState(),
      workers: [
        {
          id: 'w-1',
          name: 'Marta',
          skills: ['react'],
          availabilityPercent: 80,
        },
      ],
    }

    const payload = await encodeSharePayload(state)
    const decoded = await decodeSharePayload(payload)

    expect(EstimationsGraph.serializeText(decoded.state)).toBe(EstimationsGraph.serializeText(state))
  })

  it('rejects unknown payload versions', async () => {
    await expect(decodeSharePayload('v2.abc')).rejects.toThrow('Unsupported share payload version "v2".')
  })

  it('rejects malformed payload encoding', async () => {
    await expect(decodeSharePayload('v1.%%%')).rejects.toThrow('Invalid share payload encoding.')
  })

  it('builds a /share URL and enforces the max-length guard', () => {
    const url = buildShareUrl('v1.payload', 'https://app.example.com')

    expect(url).toBe('https://app.example.com/share?data=v1.payload')
    expect(isShareUrlTooLarge(`https://app.example.com/share?data=${'a'.repeat(MAX_SHARE_URL_LENGTH)}`)).toBe(true)
  })

  it('reports share support when compression streams exist', () => {
    expect(isShareSupported()).toBe(true)
  })
})

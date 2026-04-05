import { EstimationsGraph } from './estimations-graph'

export const SHARE_QUERY_PARAM = 'data'
export const SHARE_FORMAT_VERSION = 'v1'
export const MAX_SHARE_URL_LENGTH = 6000

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export async function encodeSharePayload(state: EstimationsGraph.GraphState): Promise<string> {
  assertCompressionSupport()
  const yaml = EstimationsGraph.serializeText(state)
  const compressed = await compressBytes(textEncoder.encode(yaml))
  return `${SHARE_FORMAT_VERSION}.${base64UrlEncode(compressed)}`
}

export async function decodeSharePayload(payload: string): Promise<EstimationsGraph.TextImportResult> {
  assertCompressionSupport()
  const trimmed = payload.trim()
  const separatorIndex = trimmed.indexOf('.')
  if (separatorIndex <= 0) {
    throw new Error('Invalid share payload format.')
  }

  const version = trimmed.slice(0, separatorIndex)
  const data = trimmed.slice(separatorIndex + 1)
  if (version !== SHARE_FORMAT_VERSION) {
    throw new Error(`Unsupported share payload version "${version}".`)
  }

  if (!data) {
    throw new Error('Share payload is empty.')
  }

  const compressed = base64UrlDecode(data)
  const yaml = textDecoder.decode(await decompressBytes(compressed))
  return EstimationsGraph.deserializeText(yaml)
}

export function buildShareUrl(
  payload: string,
  origin: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
): string {
  const url = new URL('/share', origin)
  url.searchParams.set(SHARE_QUERY_PARAM, payload)
  return url.toString()
}

export function isShareUrlTooLarge(url: string): boolean {
  return url.length > MAX_SHARE_URL_LENGTH
}

export function isShareSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
}

function assertCompressionSupport(): void {
  if (!isShareSupported()) {
    throw new Error('Share links are not supported in this browser.')
  }
}

async function compressBytes(input: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream('gzip')
  return readAllBytes(new Blob([toArrayBuffer(input)]).stream().pipeThrough(stream))
}

async function decompressBytes(input: Uint8Array): Promise<Uint8Array> {
  try {
    const stream = new DecompressionStream('gzip')
    return await readAllBytes(new Blob([toArrayBuffer(input)]).stream().pipeThrough(stream))
  } catch {
    throw new Error('Failed to decompress share payload.')
  }
}

async function readAllBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const response = new Response(stream)
  return new Uint8Array(await response.arrayBuffer())
}

function base64UrlEncode(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

  try {
    return decodeBase64(padded)
  } catch {
    throw new Error('Invalid share payload encoding.')
  }
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

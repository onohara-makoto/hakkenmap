/**
 * アップロード画像の検証。Content-Type やファイル名はクライアントが自由に偽れるため、
 * 先頭バイト（マジックナンバー）で実際の形式を判定する。
 */

export const IDENTIFY_MAX_BYTES = 8 * 1024 * 1024

export type SupportedImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'])

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end))

export function sniffImageType(bytes: Uint8Array): SupportedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && ascii(bytes, 1, 4) === 'PNG' &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  // ISO BMFF: [size(4)]['ftyp'][major brand(4)]
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp' && HEIC_BRANDS.has(ascii(bytes, 8, 12))) {
    return 'image/heic'
  }
  return null
}

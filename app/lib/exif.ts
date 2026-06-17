import exifr from 'exifr'

export type ExifData = {
  latitude: number | null
  longitude: number | null
  takenAt: Date | null
}

export async function extractExif(file: File): Promise<ExifData> {
  try {
    const result = await exifr.parse(file, { gps: true, tiff: true, exif: true })
    return {
      latitude: result?.latitude ?? null,
      longitude: result?.longitude ?? null,
      takenAt: result?.DateTimeOriginal ?? null,
    }
  } catch {
    return { latitude: null, longitude: null, takenAt: null }
  }
}

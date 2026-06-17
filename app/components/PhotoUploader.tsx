'use client'

import { useState } from 'react'
import { extractExif, type ExifData } from '@/app/lib/exif'

type Props = {
  onFileSelect: (file: File, exif: ExifData) => void
}

export default function PhotoUploader({ onFileSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [exifInfo, setExifInfo] = useState<ExifData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setIsLoading(true)
    const exif = await extractExif(file)
    setExifInfo(exif)
    setIsLoading(false)
    onFileSelect(file, exif)
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/heic"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4 file:rounded-lg
                   file:border-0 file:bg-green-50 file:text-green-700"
      />
      {preview && (
        <img src={preview} alt="プレビュー" className="w-full max-h-64 object-cover rounded-lg" />
      )}
      {isLoading && <p className="text-gray-500 text-sm">位置情報を取得中...</p>}
      {exifInfo && !isLoading && (
        <div className="bg-gray-50 text-gray-900 rounded-lg p-3 text-sm space-y-1">
          <p className="font-medium">写真情報</p>
          <p className="text-gray-600">
            {exifInfo.takenAt
              ? `撮影日時: ${exifInfo.takenAt.toLocaleString('ja-JP')}`
              : '撮影日時: 取得できませんでした'}
          </p>
          <p className="text-gray-600">
            {exifInfo.latitude && exifInfo.longitude
              ? `位置: ${exifInfo.latitude.toFixed(6)}, ${exifInfo.longitude.toFixed(6)}`
              : '位置情報: 取得できませんでした'}
          </p>
        </div>
      )}
    </div>
  )
}

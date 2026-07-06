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
    <div className="flex flex-col gap-3">
      <label style={{ cursor: 'pointer', display: 'block' }}>
        {preview ? (
          <img src={preview} alt="プレビュー" style={{
            width: '100%', height: 172, objectFit: 'cover', borderRadius: 20,
          }} />
        ) : (
          <div style={{
            height: 172, borderRadius: 20, border: '2px dashed var(--line-dashed)',
            background: 'var(--surface)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'var(--tag-warm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, color: 'var(--primary)' }}>＋</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>写真を追加</span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>撮影日・GPSを自動で読み取り</span>
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/heic" onChange={handleFileChange} className="hidden" />
      </label>

      {isLoading && <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>位置情報を取得中...</p>}
      {exifInfo && !isLoading && (
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--ink-sub)' }}>
          <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>写真情報</p>
          <p>{exifInfo.takenAt ? `撮影日時: ${exifInfo.takenAt.toLocaleString('ja-JP')}` : '撮影日時: 取得できませんでした'}</p>
          <p>{exifInfo.latitude && exifInfo.longitude ? `位置: ${exifInfo.latitude.toFixed(6)}, ${exifInfo.longitude.toFixed(6)}` : '位置情報: 取得できませんでした'}</p>
        </div>
      )}
    </div>
  )
}

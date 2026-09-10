'use client'

import { useState } from 'react'
import { extractExif, type ExifData } from '@/app/lib/exif'

type Props = {
  /** 複数選択を許可する（一括登録用） */
  multiple?: boolean
  /** 選択されたファイル群と、先頭ファイルの EXIF を返す */
  onFilesSelected: (files: File[], firstExif: ExifData) => void
}

export default function PhotoUploader({ multiple = false, onFilesSelected }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [exifInfo, setExifInfo] = useState<ExifData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setCount(files.length)
    setPreview(files.length === 1 ? URL.createObjectURL(files[0]) : null)
    setIsLoading(true)
    const exif = await extractExif(files[0])
    setExifInfo(files.length === 1 ? exif : null)
    setIsLoading(false)
    onFilesSelected(files, exif)
  }

  return (
    <div className="flex flex-col gap-3">
      <label style={{ cursor: 'pointer', display: 'block' }}>
        {preview ? (
          <img
            src={preview}
            alt="プレビュー"
            style={{ width: '100%', height: 172, objectFit: 'cover', borderRadius: 20 }}
          />
        ) : (
          <div
            style={{
              height: 172,
              borderRadius: 20,
              border: '2px dashed var(--line-dashed)',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'var(--tag-warm-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 22, color: 'var(--primary)' }}>＋</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
              {count > 1 ? `${count}枚 選択中` : multiple ? '写真を選ぶ（複数可）' : '写真を追加'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
              撮影日・GPSを自動で読み取り
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      <div aria-live="polite">
        {isLoading && <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>写真を読み込み中...</p>}
        {exifInfo && !isLoading && (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              color: 'var(--ink-sub)',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>写真情報</p>
            <p>
              {exifInfo.takenAt
                ? `撮影日時: ${exifInfo.takenAt.toLocaleString('ja-JP')}`
                : '撮影日時: 取得できませんでした'}
            </p>
            <p>
              {exifInfo.latitude && exifInfo.longitude
                ? `位置: ${exifInfo.latitude.toFixed(6)}, ${exifInfo.longitude.toFixed(6)}`
                : '位置情報: 取得できませんでした'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

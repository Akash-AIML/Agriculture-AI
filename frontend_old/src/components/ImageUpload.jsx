import { useState, useRef } from 'react'
import { t } from '../i18n/translations'

export default function ImageUpload({ lang, onFile, file, previewUrl, onClear }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) onFile(f)
  }

  const handleChange = (e) => {
    const f = e.target.files[0]
    if (f) onFile(f)
  }

  if (previewUrl) {
    return (
      <div className="upload-preview">
        <img src={previewUrl} alt="preview" />
        <div className="preview-overlay">
          <button className="btn btn-ghost" onClick={onClear} style={{ fontSize: '0.8rem' }}>
            ✕ {t(lang, 'clearBtn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`upload-zone ${dragging ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <span className="upload-icon">🌿</span>
      <p className="upload-text">{t(lang, 'uploadDrop')}</p>
      <p className="upload-hint">{t(lang, 'uploadHint')}</p>
    </div>
  )
}

import { useState } from 'react'
import ImageUpload from './ImageUpload'
import ConfidenceBar from './ConfidenceBar'
import { t } from '../i18n/translations'

export default function DiseaseTab({ lang, onResult }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [resetKey, setResetKey] = useState(0)

  const handleFile = (f) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setResetKey(k => k + 1)
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/analyze/disease', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      onResult?.('disease', data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-2">
      {/* Left: upload */}
      <div className="card">
        <div className="card-title">{t(lang, 'diseaseTitle')}</div>
        <div className="card-sub">{t(lang, 'diseaseSub')}</div>

        <ImageUpload
          key={resetKey}
          lang={lang}
          onFile={handleFile}
          file={file}
          previewUrl={previewUrl}
          onClear={handleClear}
        />

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={analyze}
            disabled={!file || loading}
          >
            {loading
              ? <><span className="spinner" /> {t(lang, 'analyzing')}</>
              : t(lang, 'analyzeBtn')}
          </button>
          {file && (
            <button className="btn btn-ghost" onClick={handleClear}>
              {t(lang, 'clearBtn')}
            </button>
          )}
        </div>

        {error && (
          <div className="warning-box" style={{ marginTop: '1rem', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', background: 'rgba(239,68,68,0.06)' }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Right: result */}
      <div className="card">
        {!result ? (
          <div className="empty-state">
            <span className="empty-icon">🔬</span>
            {t(lang, 'noDisease')}
          </div>
        ) : (
          <div className="result-card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            {/* Main detection */}
            <div className="result-label">{t(lang, 'diseaseResult')}</div>
            <div className={`result-value ${result.is_healthy ? 'healthy' : 'disease'}`}>
              {result.is_healthy ? '✓ ' : '✗ '}{result.disease}
            </div>

            <ConfidenceBar
              label={t(lang, 'confidence')}
              value={result.confidence}
            />

            {result.uncertain && (
              <div className="warning-box">⚠ {t(lang, 'uncertain')}</div>
            )}

            {result.cached && (
              <div className="tag-list">
                <span className="tag">⚡ {t(lang, 'cached')}</span>
              </div>
            )}

            {/* Treatments */}
            {!result.is_healthy && result.treatments?.length > 0 && (
              <>
                <div className="section-title">{t(lang, 'treatments')}</div>
                <div className="treatments-list">
                  {result.treatments.map((tr, i) => (
                    <div key={i} className="treatment-item">{tr}</div>
                  ))}
                </div>
              </>
            )}

            {/* Top-3 predictions */}
            {result.top3?.length > 1 && (
              <>
                <div className="section-title">{t(lang, 'top3')}</div>
                {result.top3.map((item, i) => (
                  <ConfidenceBar
                    key={i}
                    label={item.label}
                    value={item.confidence}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

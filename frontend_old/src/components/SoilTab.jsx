import { useState } from 'react'
import ImageUpload from './ImageUpload'
import ConfidenceBar from './ConfidenceBar'
import { t } from '../i18n/translations'

export default function SoilTab({ lang, onResult }) {
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
    setFile(null); setPreview(null); setResult(null); setError(null);
    setResetKey(k => k + 1);
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/analyze/soil', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      onResult?.('soil', data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const soilColor = {
    "Alluvial soil": '#65a30d', "Black Soil": '#171717', "Clay soil": '#a16207', "Red soil": '#dc2626'
  }

  return (
    <div className="grid-2">
      {/* Left: upload */}
      <div className="card">
        <div className="card-title">{t(lang, 'soilTitle')}</div>
        <div className="card-sub">{t(lang, 'soilSub')}</div>

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
          <div className="warning-box" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', background: 'rgba(239,68,68,0.06)' }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Right: result */}
      <div className="card">
        {!result ? (
          <div className="empty-state">
            <span className="empty-icon">🪨</span>
            {t(lang, 'noSoil')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Soil type hero */}
            <div className="result-card" style={{
              borderLeft: `4px solid ${soilColor[result.soil_type] || '#22c55e'}`,
            }}>
              <div className="result-label">{t(lang, 'soilResult')}</div>
              <div className="result-value" style={{ color: soilColor[result.soil_type] || '#22c55e' }}>
                {result.soil_type}
              </div>
              <ConfidenceBar label={t(lang, 'confidence')} value={result.confidence} />
              {result.uncertain && (
                <div className="warning-box">⚠ {t(lang, 'uncertain')}</div>
              )}
              {result.cached && (
                <div className="tag-list"><span className="tag">⚡ {t(lang, 'cached')}</span></div>
              )}
            </div>

            {/* Properties */}
            <div className="result-card">
              <div className="result-label">{t(lang, 'soilProps')}</div>
              <div className="prop-grid">
                <div className="prop-item">
                  <div className="prop-key">{t(lang, 'waterRet')}</div>
                  <div className="prop-val">{result.water_retention}</div>
                </div>
                <div className="prop-item">
                  <div className="prop-key">{t(lang, 'drainage')}</div>
                  <div className="prop-val">{result.drainage}</div>
                </div>
                <div className="prop-item">
                  <div className="prop-key">{t(lang, 'fertility')}</div>
                  <div className="prop-val">{result.fertility}</div>
                </div>
              </div>

              {result.suitable_crops?.length > 0 && (
                <>
                  <div className="section-title">{t(lang, 'suitableCrops')}</div>
                  <div className="tag-list">
                    {result.suitable_crops.map((c, i) => (
                      <span key={i} className="tag green">{c}</span>
                    ))}
                  </div>
                </>
              )}

              {result.tips?.length > 0 && (
                <>
                  <div className="section-title">{t(lang, 'soilTips')}</div>
                  <div className="treatments-list">
                    {result.tips.map((tip, i) => (
                      <div key={i} className="treatment-item">{tip}</div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* All classes breakdown */}
            {result.all_classes?.length > 1 && (
              <div className="result-card">
                <div className="result-label">{t(lang, 'top3')}</div>
                {result.all_classes.map((item, i) => (
                  <ConfidenceBar key={i} label={item.label} value={item.confidence} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

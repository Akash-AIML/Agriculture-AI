import { useState } from 'react'
import { t } from '../i18n/translations'

const FIELDS = [
  { key: 'N',           min: 0,  max: 200,  step: 1,   default: 80  },
  { key: 'P',           min: 0,  max: 200,  step: 1,   default: 40  },
  { key: 'K',           min: 0,  max: 200,  step: 1,   default: 40  },
  { key: 'temperature', min: 0,  max: 50,   step: 0.5, default: 25  },
  { key: 'humidity',    min: 0,  max: 100,  step: 1,   default: 65  },
  { key: 'ph',          min: 0,  max: 14,   step: 0.1, default: 6.5 },
  { key: 'rainfall',    min: 0,  max: 3000, step: 10,  default: 800 },
]

function SliderField({ field, value, onChange, label }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="slider-container">
        <input
          type="range"
          className="form-slider"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={(e) => onChange(field.key, parseFloat(e.target.value))}
        />
        <span className="slider-value">{value}</span>
      </div>
    </div>
  )
}

export default function CropTab({ lang, onResult }) {
  const [values, setValues] = useState(
    Object.fromEntries(FIELDS.map(f => [f.key, f.default]))
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  const handleChange = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const recommend = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/v1/recommend/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, language: lang }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      onResult?.('crop', data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-2">
      {/* Left: inputs */}
      <div className="card">
        <div className="card-title">{t(lang, 'cropTitle')}</div>
        <div className="card-sub">{t(lang, 'cropSub')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FIELDS.map(f => (
            <SliderField
              key={f.key}
              field={f}
              value={values[f.key]}
              onChange={handleChange}
              label={t(lang, f.key)}
            />
          ))}
        </div>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={recommend}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> {t(lang, 'recommending')}</>
              : t(lang, 'recommendBtn')}
          </button>
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
            <span className="empty-icon">🌾</span>
            {t(lang, 'noCrop')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top recommendation */}
            <div className="result-card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="result-label">{t(lang, 'topCrop')}</div>
              <div className="result-value healthy" style={{ textTransform: 'capitalize', fontSize: '1.7rem' }}>
                🌱 {result.recommended_crop}
              </div>
              {result.tip && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {result.tip}
                </p>
              )}
              {result.cached && (
                <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                  <span className="tag">⚡ {t(lang, 'cached')}</span>
                </div>
              )}
            </div>

            {/* Alternatives */}
            {result.recommendations?.length > 1 && (
              <div className="result-card">
                <div className="result-label">{t(lang, 'alternatives')}</div>
                <div className="crop-recs">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="crop-rec-item">
                      <span className="crop-rec-rank">#{i + 1}</span>
                      <span className="crop-rec-name">{rec.crop}</span>
                      <span className="crop-rec-prob">{rec.probability.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input warnings */}
            {result.input_warnings?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {result.input_warnings.map((w, i) => (
                  <div key={i} className="warning-box">⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

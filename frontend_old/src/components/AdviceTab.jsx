import { useState, useRef } from 'react'
import { t } from '../i18n/translations'

export default function AdviceTab({ lang, diseaseResult, soilResult, cropResult }) {
  const [advice, setAdvice]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError]       = useState(null)
  const abortRef                = useRef(null)

  const hasData = diseaseResult || soilResult || cropResult

  const getAdvice = async () => {
    if (!hasData) return
    if (abortRef.current) abortRef.current.abort()

    setLoading(true)
    setAdvice('')
    setError(null)
    setStreaming(false)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/v1/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease_result: diseaseResult || null,
          soil_result:    soilResult    || null,
          crop_result:    cropResult    || null,
          language:       lang,
          stream:         true,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      setLoading(false)
      setStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setAdvice(prev => prev + chunk)
        }
      }

    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  // Summary badges of what data we have
  const dataBadges = [
    diseaseResult && { label: '🔬 ' + (diseaseResult.disease || 'Disease'), cls: 'green' },
    soilResult    && { label: '🪨 ' + (soilResult.soil_type   || 'Soil'),    cls: 'gold'  },
    cropResult    && { label: '🌾 ' + (cropResult.recommended_crop || 'Crop'), cls: 'green' },
  ].filter(Boolean)

  return (
    <div className="card" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="card-title">{t(lang, 'adviceTitle')}</div>
      <div className="card-sub">{t(lang, 'adviceSub')}</div>

      {/* Data badges */}
      {dataBadges.length > 0 && (
        <div className="tag-list" style={{ marginBottom: '1.25rem' }}>
          {dataBadges.map((b, i) => (
            <span key={i} className={`tag ${b.cls}`}>{b.label}</span>
          ))}
        </div>
      )}

      {/* No data warning */}
      {!hasData && (
        <div className="warning-box" style={{ marginBottom: '1.25rem' }}>
          ⚠ {t(lang, 'noAnalysis')}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={getAdvice}
        disabled={loading || streaming || !hasData}
        style={{ marginBottom: '1.5rem' }}
      >
        {loading
          ? <><span className="spinner" /> {t(lang, 'gettingAdvice')}</>
          : streaming
            ? <><span className="spinner" /> {t(lang, 'gettingAdvice')}</>
            : '✨ ' + t(lang, 'getAdviceBtn')}
      </button>

      {error && (
        <div className="warning-box" style={{ marginBottom: '1rem', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', background: 'rgba(239,68,68,0.06)' }}>
          ⚠ {error}
        </div>
      )}

      {advice ? (
        <>
          <div className="section-title">{t(lang, 'adviceResult')}</div>
          <div className={`advice-content ${streaming ? 'streaming' : ''}`}>
            {advice}
          </div>
        </>
      ) : !loading && !streaming && (
        <div className="empty-state">
          <span className="empty-icon">🤖</span>
          {t(lang, 'noAdvice')}
        </div>
      )}
    </div>
  )
}

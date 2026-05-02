import { useState, useEffect } from 'react'
import DiseaseTab from './components/DiseaseTab'
import SoilTab    from './components/SoilTab'
import CropTab    from './components/CropTab'
import AdviceTab  from './components/AdviceTab'
import { LANGUAGES, t } from './i18n/translations'

const TABS = [
  { id: 'disease', icon: '🔬' },
  { id: 'soil',    icon: '🪨' },
  { id: 'crop',    icon: '🌾' },
  { id: 'advice',  icon: '🤖' },
]

export default function App() {
  const [lang, setLang]               = useState('en')
  const [activeTab, setActiveTab]     = useState('disease')
  const [apiOk, setApiOk]             = useState(null)
  const [diseaseResult, setDisease]   = useState(null)
  const [soilResult, setSoil]         = useState(null)
  const [cropResult, setCrop]         = useState(null)

  // Health check
  useEffect(() => {
    fetch('/api/v1/health')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  const handleResult = (type, data) => {
    if (type === 'disease') setDisease(data)
    if (type === 'soil')    setSoil(data)
    if (type === 'crop')    setCrop(data)
  }

  // Tab label translation map
  const tabLabel = { disease: 'tabDisease', soil: 'tabSoil', crop: 'tabCrop', advice: 'tabAdvice' }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🌿</div>
            <span className="logo-text">Agro<span>Sense</span> AI</span>
          </div>
          <div className="header-spacer" />

          {/* API status badge */}
          <div className="api-badge">
            <span className={`api-dot ${apiOk === true ? 'ok' : ''}`} />
            {apiOk === null ? '…' : apiOk ? t(lang, 'connected') : t(lang, 'disconnected')}
          </div>

          {/* Language selector */}
          <div className="lang-selector">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`lang-btn ${lang === l.code ? 'active' : ''}`}
                onClick={() => setLang(l.code)}
                title={l.name}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="page-container">
        <div className="hero">
          <h1 className="hero-title">
            {t(lang, 'appName').split('AI')[0]}
            <em>AI</em>
          </h1>
          <p className="hero-sub">{t(lang, 'appTagline')}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {t(lang, tabLabel[tab.id])}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'disease' && (
          <DiseaseTab lang={lang} onResult={handleResult} />
        )}
        {activeTab === 'soil' && (
          <SoilTab lang={lang} onResult={handleResult} />
        )}
        {activeTab === 'crop' && (
          <CropTab lang={lang} onResult={handleResult} />
        )}
        {activeTab === 'advice' && (
          <AdviceTab
            lang={lang}
            diseaseResult={diseaseResult}
            soilResult={soilResult}
            cropResult={cropResult}
          />
        )}
      </div>
    </>
  )
}

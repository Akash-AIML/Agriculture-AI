export default function ConfidenceBar({ label, value, animate = true }) {
  const cls =
    value >= 75 ? 'high' :
    value >= 50 ? 'medium' : 'low'

  return (
    <div className="conf-bar-wrap">
      <div className="conf-bar-label">
        <span className="name">{label}</span>
        <span className="value">{value.toFixed(1)}%</span>
      </div>
      <div className="conf-bar-track">
        <div
          className={`conf-bar-fill ${cls !== 'high' ? cls : ''}`}
          style={{ width: animate ? `${value}%` : 0 }}
        />
      </div>
    </div>
  )
}

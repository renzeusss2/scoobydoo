interface ProgressBarProps {
  value: number; // 0-100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const fillClass =
    value >= 85 ? "progress-fill high" :
    value >= 60 ? "progress-fill mid" :
    "progress-fill";

  return (
    <>
      <div className="progress-wrap">
        <span className="progress-label">Utilization</span>
        <span className="progress-label">{value}%</span>
      </div>
      <div className="progress-bar">
        <div className={fillClass} style={{ width: `${value}%` }} />
      </div>
    </>
  );
}
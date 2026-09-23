export default function SliderField({
  id,
  label,
  value,
  min = 0,
  max = 10,
  step = 1,
  unit = '',
  display,
  hint,
  onChange,
  error,
}) {
  return (
    <label className="block rounded-xl border border-hud-border bg-hud-panel p-4" htmlFor={id}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm text-hud-accent">
          {display ?? `${value}${unit}`}
        </span>
      </div>
      {hint ? <p className="mt-1 text-xs text-hud-muted">{hint}</p> : null}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full"
      />
      {error ? <p className="mt-2 text-xs text-status-alert">{error}</p> : null}
    </label>
  )
}

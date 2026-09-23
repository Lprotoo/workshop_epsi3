export default function ChoiceField({ label, value, options, onChange, error }) {
  return (
    <fieldset className="rounded-xl border border-hud-border bg-hud-panel p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className={`mt-3 grid grid-cols-2 gap-2 ${options.length > 4 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                selected
                  ? 'border-hud-accent bg-hud-accent/15 text-white'
                  : 'border-hud-border text-hud-muted hover:border-hud-accent/50 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-status-alert">{error}</p> : null}
    </fieldset>
  )
}

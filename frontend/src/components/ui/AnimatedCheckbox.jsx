import './AnimatedCheckbox.css'

export default function AnimatedCheckbox({
  id,
  checked = false,
  disabled = false,
  onChange,
  children,
  className = '',
}) {
  const maskId = `checkbox-mask-${id}`

  return (
    <div className={`checkbox-wrapper${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <label className="terms-label" htmlFor={id}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 200 200" className="checkbox-svg">
          <mask fill="white" id={maskId}>
            <rect height={200} width={200} />
          </mask>
          <rect
            mask={`url(#${maskId})`}
            strokeWidth={40}
            className="checkbox-box"
            height={200}
            width={200}
          />
          <path strokeWidth={15} d="M52 111.018L76.9867 136L149 64" className="checkbox-tick" />
        </svg>
        {children ? <span className="label-text">{children}</span> : null}
      </label>
    </div>
  )
}

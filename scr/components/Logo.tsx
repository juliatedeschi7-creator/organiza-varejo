interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`organiza-logo ${className}`}>
      <img
        src="/logo-organiza-transparente.png"
        alt="Organiza"
        className="organiza-logo__symbol"
      />

      <span className="organiza-logo__name">Organiza</span>
    </div>
  )
}

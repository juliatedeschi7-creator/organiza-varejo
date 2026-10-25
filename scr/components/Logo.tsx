
interface LogoProps {
  className?: string
  somenteSimbolo?: boolean
}

export function Logo({
  className = '',
  somenteSimbolo = false,
}: LogoProps) {
  return (
    <div
      className={`organiza-logo ${somenteSimbolo ? 'organiza-logo--simbolo' : ''} ${className}`}
    >
      <img
        src="/logo-organiza-transparente.png"
        alt={somenteSimbolo ? 'Organiza' : ''}
        className="organiza-logo__symbol"
      />

      {!somenteSimbolo && (
        <span className="organiza-logo__name">
          Organiza
        </span>
      )}
    </div>
  )
}

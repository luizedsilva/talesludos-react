// Ícone do Bootstrap Icons: <Icon name="pencil" />
export default function Icon({ name, className = '', ...rest }) {
  return <i className={`bi bi-${name} ${className}`} aria-hidden="true" {...rest} />
}

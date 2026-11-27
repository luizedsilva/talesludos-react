import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="notfound">
      <img src={`${import.meta.env.BASE_URL}images/marca/icone-mapa-laranja.webp`} alt="" />
      <h1>Página não encontrada</h1>
      <p className="text-body-secondary mb-4">Este caminho não leva a nenhum lugar do mapa. Que tal voltar ao início?</p>
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        <Button as={Link} to="/">Página inicial</Button>
        <Button as={Link} to="/jogos" variant="secondary">Meus jogos</Button>
      </div>
    </div>
  )
}

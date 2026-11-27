import { Navbar, Nav, Container } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'

// Sobre o fundo roxo, a marca usa a versão "fundo colorido" (manual da marca).
export default function Header() {
  return (
    <Navbar expand="lg" variant="dark" className="app-navbar">
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/" title="Página inicial">
          <img src={`${import.meta.env.BASE_URL}images/marca/logo-fundo-colorido.svg`} alt="Tales Ludos" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav-collapse" />
        <Navbar.Collapse id="nav-collapse">
          <Nav className="ms-lg-3">
            <Nav.Link as={NavLink} to="/jogos" end>Meus jogos</Nav.Link>
            <Nav.Link as={NavLink} to="/jogos/novo/dados">Novo jogo</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

import { Navbar, Nav, Container } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <Navbar expand="lg" variant="dark" className="app-navbar mb-3">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img src="/images/logo-150.png" alt="Tales Ludos" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav-collapse" />
        <Navbar.Collapse id="nav-collapse">
          <Nav>
            <Nav.Link as={NavLink} to="/jogos">Meus jogos</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

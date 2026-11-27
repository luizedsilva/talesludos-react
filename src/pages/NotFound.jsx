import { Card, Row, Col } from 'react-bootstrap'

export default function NotFound() {
  return (
    <div className="container">
      <Card border="primary" className="text-center">
        <Card.Header className="bg-primary text-white">Erro 404</Card.Header>
        <Row className="g-0 align-items-center">
          <Col md={4}>
            <Card.Img src={`${import.meta.env.BASE_URL}images/404.png`} alt="imagem de erro 404" className="rounded-0" />
          </Col>
          <Col md={8}>
            <Card.Body>
              <h1>Página não encontrada!</h1>
              <h5>Esta página foi removida ou nunca existiu!</h5>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

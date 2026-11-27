import { useState } from 'react'
import { Button, Card, Collapse, Row, Col, Ratio } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const HISTORY = [
  {
    img: '/images/tela1.png',
    title: 'Primeira versão',
    text:
      'Na versão inicial, pensamos na definição do jogo numa única tela. À esquerda estavam as opções de inclusão ' +
      'de cenas e desafios e à direita a ferramenta de desenho do roteiro do jogo. A cada cena criada, uma marca ' +
      'correspondente era incluída na tela de desenho. E para cada cena criada, o autor ainda podia definir os ' +
      'desafios. Esta versão foi desenvolvida pelos estudantes bolsistas do curso de Ciência da Computação: ' +
      'Henrique dos Santos Wisniewski, Filipe Parisoto Ribeiro, Denner Azevedo Rocha e Henrique Alves de Oliveira ' +
      'com a supervisão do Analista Luis Philipe Garroni Andrade e a coordenação do servidor Marcos de Abreu Nery e ' +
      'dos professores Luiz Eduardo da Silva e Gabriel Gerber Hornink.'
  },
  {
    img: '/images/sequencia.png',
    title: 'Segunda versão',
    text:
      'Nesta versão, o autor do jogo registrava-se no ambiente para construir os seus jogos, que ficavam guardados ' +
      'em um servidor. Na tela de criação ou edição do jogo o usuário informava o título, uma descrição e a imagem ' +
      'de fundo do jogo. Na etapa seguinte, o autor incluía a dinâmica do jogo, ou seja, marcava locais na imagem ' +
      'de fundo e definia a sequência didática de conteúdos e atividades desse percurso.'
  },
  {
    img: '/images/jogo.png',
    title: 'Versão atual',
    text:
      'Agora a ferramenta funciona inteiramente no navegador, sem cadastro. Os jogos ficam guardados no próprio ' +
      'navegador e podem ser salvos em arquivo para continuar a edição depois. O resultado final é um arquivo .zip ' +
      'com a imagem e a dinâmica do jogo: basta descompactá-lo e abrir o "index.html". O jogo ainda pode ser ' +
      'embutido no Moodle e em outros ambientes que aceitam objetos de aprendizagem no formato SCORM.'
  }
]

export default function Home() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <img src="/images/banner.png" className="home-banner mb-2" alt="Photo by Waldemar Brandt on Unsplash" />
      <div>
        <Button onClick={() => setOpen(o => !o)} aria-expanded={open}>Histórico</Button>
        <Collapse in={open}>
          <div>
            <Row xs={1} md={3} className="g-3 mt-1">
              {HISTORY.map(h => (
                <Col key={h.title}>
                  <Card className="h-100">
                    <Card.Img variant="top" src={h.img} alt={h.title} />
                    <Card.Body>
                      <Card.Title>{h.title}</Card.Title>
                      <Card.Text>{h.text}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Collapse>
      </div>

      <div className="p-4 p-md-5 my-3 bg-light rounded-3">
        <h1 className="display-4">Tales Ludos</h1>
        <p className="lead">Ferramenta para construção de jogos educacionais</p>
        <p>
          Tales Ludos é uma ferramenta de autoria que possibilita a construção de um jogo baseado em cenários, locais
          do cenário, personagens e interações, que exige pouco conhecimento técnico por parte do autor. O roteiro do
          jogo é criado com o preenchimento de alguns formulários, onde o autor define o título, uma descrição e uma
          imagem de fundo para o jogo. Nessa imagem, o autor inclui os locais onde ocorrerão as interações. Em cada
          local é apresentado um conteúdo da cena e, para cada conteúdo, um desafio. Ao vencer o desafio, o jogo passa
          para a próxima etapa, com uma animação do personagem. O jogo exportado (SCORM, HTML5 e JavaScript) pode ser
          usado em diversos sistemas operacionais e dispositivos (computadores, tablets, smartphones).
        </p>
        <Button as={Link} to="/jogos" className="me-2">Criar um jogo</Button>
        <Button variant="outline-primary" href="/game/index.html" target="_blank">Exemplo de jogo</Button>
      </div>

      <Ratio aspectRatio="16x9" className="mb-4">
        <iframe src="https://www.youtube.com/embed/EWVYXlFXFhE" title="Apresentação do Tales Ludos" allowFullScreen />
      </Ratio>

      <hr />
      <h2>Apoio</h2>
      <Row className="align-items-center text-center mb-4">
        <Col>
          <a href="http://www.capes.gov.br"><img src="/images/capes.jpg" className="img-fluid w-25" alt="Logomarca da CAPES" /></a>
        </Col>
        <Col>
          <a href="http://www.unifal-mg.edu.br"><img src="/images/unifal.png" className="img-fluid w-75" alt="Logomarca da UNIFAL-MG" /></a>
        </Col>
      </Row>

      <hr />
      <h2>Desenvolvido com</h2>
      <Row className="align-items-center text-center">
        <Col>
          <a href="https://react.dev" className="fs-2 text-decoration-none">React</a>
        </Col>
        <Col>
          <a href="https://p5js.org"><img src="/images/p5js.png" className="img-fluid w-50" alt="p5.js" /></a>
        </Col>
      </Row>
    </div>
  )
}

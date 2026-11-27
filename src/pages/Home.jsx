import { Accordion, Button, Container, Row, Col, Ratio } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const BASE = import.meta.env.BASE_URL
const img = name => `${BASE}images/${name}`
const marca = name => `${BASE}images/marca/${name}`

const STEPS = [
  { icon: 'icone-dados-roxo.webp', title: 'Escolha o cenário', text: 'Defina o título, a apresentação e uma imagem de fundo: um mapa, uma planta, uma paisagem.' },
  { icon: 'icone-mapa-roxo.webp', title: 'Marque os locais', text: 'Clique na imagem para traçar o percurso do jogo, local por local.' },
  { icon: 'icone-dialogo-roxo.webp', title: 'Crie cenas e desafios', text: 'Em cada local, apresente um conteúdo e proponha um desafio ao jogador.' },
  { icon: 'icone-computador-roxo.webp', title: 'Exporte e compartilhe', text: 'Baixe o jogo pronto e publique em qualquer site ou no Moodle (SCORM).' }
]

const FEATURES = [
  { icon: 'bi-person-check', title: 'Sem cadastro', text: 'Abra e comece a criar. Não há login, senha ou conta.' },
  { icon: 'bi-hdd', title: 'Salvo no seu computador', text: 'Os jogos ficam no navegador e podem ser salvos em arquivo .tlud.' },
  { icon: 'bi-mortarboard', title: 'Compatível com o Moodle', text: 'O jogo exportado é um pacote SCORM 1.2, pronto para o AVA.' },
  { icon: 'bi-phone', title: 'Roda em qualquer lugar', text: 'HTML5 e JavaScript: computadores, tablets e smartphones.' },
  { icon: 'bi-ui-checks', title: 'Cinco tipos de desafio', text: 'Verdadeiro ou falso, múltipla escolha, lacuna, associação e resposta curta.' },
  { icon: 'bi-github', title: 'Gratuito e aberto', text: 'Desenvolvido na UNIFAL-MG, com o código disponível no GitHub.' }
]

// Valores do projeto, conforme o manual da marca.
const VALUES = [
  { title: 'Colaboração', text: 'Nascido em um espaço universitário, o projeto é colaborativo dentro e fora dele.' },
  { title: 'Acolhedor', text: 'Quer se aproximar das pessoas, com uma identidade visual convidativa.' },
  { title: 'Disseminação', text: 'Cria, registra e valoriza materiais, e sobretudo dissemina conhecimento.' },
  { title: 'Acessível', text: 'É gratuito: mais colaboração e mais conhecimento compartilhado.' }
]

const HISTORY = [
  {
    img: img('tela1.png'),
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
    img: img('sequencia.png'),
    title: 'Segunda versão',
    text:
      'Nesta versão, o autor do jogo registrava-se no ambiente para construir os seus jogos, que ficavam guardados ' +
      'em um servidor. Na tela de criação ou edição do jogo o usuário informava o título, uma descrição e a imagem ' +
      'de fundo do jogo. Na etapa seguinte, o autor incluía a dinâmica do jogo, ou seja, marcava locais na imagem ' +
      'de fundo e definia a sequência didática de conteúdos e atividades desse percurso.'
  },
  {
    img: img('jogo.png'),
    title: 'Versão atual (React)',
    text:
      'Agora a ferramenta funciona inteiramente no navegador, sem cadastro. Os jogos ficam guardados no próprio ' +
      'navegador e podem ser salvos em arquivo para continuar a edição depois. O resultado final é um arquivo .zip ' +
      'com a imagem e a dinâmica do jogo: basta descompactá-lo e abrir o "index.html". O jogo ainda pode ser ' +
      'embutido no Moodle e em outros ambientes que aceitam objetos de aprendizagem no formato SCORM.'
  }
]

const TECH = [
  { href: 'https://react.dev', src: img('react.svg'), label: 'React' },
  { href: 'https://p5js.org', src: img('p5js.png'), label: 'p5.js' }
]

export default function Home() {
  return (
    <div className="landing">
      {/* Barra superior */}
      <nav className="landing-nav">
        <Container className="d-flex align-items-center justify-content-between">
          <Link to="/" aria-label="Tales Ludos, página inicial">
            <img src={marca('logo.svg')} alt="Tales Ludos" className="landing-nav-logo" />
          </Link>
          <div className="d-flex gap-4 align-items-center">
            <a href="#como-funciona" className="landing-nav-link d-none d-md-inline">Como funciona</a>
            <a href="#sem-cadastro" className="landing-nav-link d-none d-md-inline">Sem cadastro</a>
            <a href="#sobre" className="landing-nav-link d-none d-lg-inline">Sobre</a>
            <Button as={Link} to="/jogos" size="sm" variant="primary">TalesLudos online</Button>
          </div>
        </Container>
      </nav>

      {/* Destaque */}
      <header className="landing-hero">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6} className="landing-hero-text">
              <span className="landing-badge"><i className="bi bi-stars" />Nova versão, 100% no navegador</span>
              <h1 className="landing-title">Crie jogos educacionais <em>a partir de um mapa</em></h1>
              <p className="landing-lead">
                Escolha uma imagem, marque os locais do percurso e, em cada um, apresente um conteúdo e um desafio.
                Sem instalar nada e sem criar conta.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Button as={Link} to="/jogos" size="lg" className="btn-laranja">
                  <i className="bi bi-play-circle-fill me-2" />TalesLudos online
                </Button>
                <Button variant="outline-light" size="lg" href={`${BASE}game/index.html`} target="_blank" rel="noopener">
                  <i className="bi bi-controller me-2" />Exemplo de jogo
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <img src={marca('composicao-roxo.webp')} alt="" className="landing-hero-art" />
            </Col>
          </Row>
        </Container>
      </header>

      {/* Sem cadastro */}
      <section id="sem-cadastro" className="landing-section landing-section-cinza">
        <Container className="landing-narrow">
          <div className="landing-notice">
            <img src={marca('icone-computador-laranja.webp')} alt="" />
            <div>
              <h2 className="h3">Não é preciso criar conta</h2>
              <p className="mb-2">
                Nesta nova versão, o Tales Ludos funciona inteiramente no seu navegador, como o eXeLearning online.
                <strong> Os jogos são salvos localmente</strong>, no próprio navegador do seu computador: nada é enviado
                a um servidor, e por isso não há cadastro, login ou senha.
              </p>
              <p className="mb-0 text-body-secondary small">
                <i className="bi bi-info-circle me-1" />
                Se os dados do navegador forem limpos, os jogos guardados nele são apagados. Use <em>Salvar projeto em
                arquivo</em> para baixar um <code>.tlud</code> como cópia de segurança ou para continuar em outro
                computador.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="landing-section">
        <Container>
          <span className="landing-eyebrow">Passo a passo</span>
          <h2 className="landing-section-title">Como funciona</h2>
          <p className="landing-section-lead">Quatro etapas separam uma imagem de um jogo pronto para a sala de aula.</p>
          <Row xs={1} sm={2} lg={4} className="g-4">
            {STEPS.map((s, i) => (
              <Col key={s.title}>
                <div className="landing-step">
                  <span className="landing-step-num" aria-hidden="true">{i + 1}</span>
                  <img src={marca(s.icon)} alt="" />
                  <h3>{s.title}</h3>
                  <p className="mb-0">{s.text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Vídeo */}
      <section className="landing-section landing-section-cinza">
        <Container className="landing-narrow">
          <span className="landing-eyebrow">Tutorial</span>
          <h2 className="landing-section-title">Veja como criar um jogo</h2>
          <p className="landing-section-lead">
            A construção do jogo “Noite estrelada de Van Gogh”: marcar os locais na pintura, criar cenas e
            desafios, jogar e exportar.
          </p>
          <Ratio aspectRatio="16x9" className="landing-video">
            <video
              controls
              preload="none"
              poster={`${BASE}video/como-criar-um-jogo.jpg`}
              aria-label="Tutorial: como criar um jogo no Tales Ludos"
            >
              <source src={`${BASE}video/como-criar-um-jogo.mp4`} type="video/mp4" />
              Seu navegador não reproduz vídeos.{' '}
              <a href={`${BASE}video/como-criar-um-jogo.mp4`}>Baixe o vídeo</a>.
            </video>
          </Ratio>
        </Container>
      </section>

      {/* Recursos */}
      <section className="landing-section">
        <Container>
          <span className="landing-eyebrow">Recursos</span>
          <h2 className="landing-section-title">Por que usar</h2>
          <p className="landing-section-lead">Feito para professores: simples de aprender e livre para usar.</p>
          <Row xs={1} md={2} lg={3} className="g-4">
            {FEATURES.map(f => (
              <Col key={f.title}>
                <div className="landing-feature">
                  <span className="landing-feature-icon"><i className={`bi ${f.icon}`} /></span>
                  <div>
                    <h3>{f.title}</h3>
                    <p className="mb-0">{f.text}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Sobre */}
      <section id="sobre" className="landing-section landing-section-cinza">
        <Container>
          <span className="landing-eyebrow">Sobre</span>
          <h2 className="landing-section-title">Um projeto da UNIFAL-MG</h2>
          <p className="landing-about">
            O Tales Ludos é uma ferramenta online de fácil aprendizado para construir jogos baseados em cenários,
            locais, personagens, animações e interações. Ele faz parte de um grupo de projetos da UNIFAL-MG que difunde
            metodologias ativas na construção e no compartilhamento de materiais para todas as modalidades e níveis
            de ensino.
          </p>
          <Row xs={1} sm={2} lg={4} className="g-4 mb-5">
            {VALUES.map(v => (
              <Col key={v.title}>
                <div className="landing-value">
                  <h3>{v.title}</h3>
                  <p className="mb-0">{v.text}</p>
                </div>
              </Col>
            ))}
          </Row>

          <div className="landing-narrow mx-auto">
            <h3 className="h5 text-center mb-3" style={{ color: 'var(--tl-roxo)' }}>Histórico</h3>
            <Accordion defaultActiveKey="2">
              {HISTORY.map((h, i) => (
                <Accordion.Item eventKey={String(i)} key={h.title}>
                  <Accordion.Header>{h.title}</Accordion.Header>
                  <Accordion.Body>
                    <Row className="g-3 align-items-center">
                      <Col md={5}><img src={h.img} alt={h.title} className="img-fluid rounded" /></Col>
                      <Col md={7}><p className="mb-0">{h.text}</p></Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        </Container>
      </section>

      {/* Chamada final */}
      <section className="landing-cta" style={{ backgroundImage: `url(${marca('composicao-laranja.webp')})` }}>
        <Container>
          <div className="landing-cta-box">
            <h2 className="mb-2">Pronto para criar o seu jogo?</h2>
            <p className="mb-4 opacity-75">É gratuito, sem cadastro e direto no navegador.</p>
            <Button as={Link} to="/jogos" size="lg" className="btn-laranja">
              <i className="bi bi-play-circle-fill me-2" />TalesLudos online
            </Button>
          </div>
        </Container>
      </section>

      {/* Apoio e tecnologias */}
      <section className="landing-section">
        <Container>
          <Row className="g-4 gy-5 text-center">
            <Col md={6}>
              <h2 className="landing-small-title">Apoio</h2>
              <div className="landing-logos">
                <a href="https://www.gov.br/capes" target="_blank" rel="noopener"><img src={img('capes.jpg')} alt="CAPES" /></a>
                <a href="https://www.unifal-mg.edu.br" target="_blank" rel="noopener"><img src={img('unifal.png')} alt="UNIFAL-MG" /></a>
              </div>
            </Col>
            <Col md={6}>
              <h2 className="landing-small-title">Desenvolvido com</h2>
              <div className="landing-logos">
                {TECH.map(t => (
                  <a key={t.label} href={t.href} target="_blank" rel="noopener" className="landing-tech">
                    <img src={t.src} alt="" />
                    <span>{t.label}</span>
                  </a>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <footer className="landing-footer">
        <Container className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <img src={marca('logo-negativo.svg')} alt="Tales Ludos" />
          <span>Um projeto da UNIFAL-MG · gratuito e de código aberto</span>
          <a href="https://github.com/luizedsilva/talesludos-react" target="_blank" rel="noopener">
            <i className="bi bi-github me-1" />Código-fonte
          </a>
        </Container>
      </footer>
    </div>
  )
}

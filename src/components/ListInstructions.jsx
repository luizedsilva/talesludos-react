import { useState } from 'react'
import { Button, Offcanvas, Table } from 'react-bootstrap'
import Icon from './Icon'

const ITEMS = [
  ['pencil', 'Editar dados', 'Altera o título, a descrição, a área e a imagem de fundo do jogo.'],
  ['geo-alt', 'Editar mapa', 'Marca os locais na imagem e define as cenas e os desafios do percurso.'],
  ['eye', 'Detalhes', 'Mostra os dados do jogo e permite excluí-lo deste navegador.'],
  ['controller', 'Visualizar', 'Abre o jogo em uma nova aba do navegador, para experimentá-lo como o aluno verá.'],
  ['save', 'Salvar projeto',
    <>Baixa um arquivo <code>.tlud</code> com todo o projeto. Use-o como cópia de segurança ou para
      continuar a edição em outro computador, com o botão <b>Abrir projeto</b>.</>],
  ['file-earmark-zip', 'Exportar jogo',
    <>Baixa um <code>.zip</code> com o jogo pronto. Descompacte e abra o <code>index.html</code>,
      publique em um site ou envie ao Moodle como pacote SCORM.</>]
]

export default function ListInstructions() {
  const [show, setShow] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setShow(true)}>Instruções</Button>
      <Offcanvas show={show} onHide={() => setShow(false)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Listagem de jogos</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <p>Essa é a tela que apresenta os jogos guardados neste navegador. As opções são:</p>
          <Table striped hover size="sm">
            <tbody>
              {ITEMS.map(([icon, title, text]) => (
                <tr key={icon}>
                  <td><Icon name={icon} /></td>
                  <td><h6 className="mb-1">{title}</h6>{text}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

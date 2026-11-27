import { useState } from 'react'
import { Button, Modal, Image } from 'react-bootstrap'
import Icon from './Icon'
import { isTouchDevice } from '../utils'

export default function MapInstructions() {
  const [show, setShow] = useState(false)
  const touch = isTouchDevice()

  return (
    <>
      <Button variant="secondary" onClick={() => setShow(true)}>Instruções</Button>
      <Modal show={show} onHide={() => setShow(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Como criar o jogo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <h4>Menu</h4>
          <ul className="list-unstyled">
            <li><Icon name="plus-circle" /> <b>Adicionar marca:</b> clique na imagem para incluir uma nova marca.</li>
            <li><Icon name="puzzle" /> <b>Editar marca:</b> clique em uma marca para editar a cena e o desafio correspondente.</li>
            <li><Icon name="list-ol" /> <b>Ver todos os desafios:</b> mostra todos os desafios e permite reordená-los.</li>
            {touch && (
              <li><Icon name="arrows-move" /> <b>Mover marca:</b> toque na marca e depois na nova posição.</li>
            )}
          </ul>

          <h4>Adicionar marca</h4>
          <p>
            Clique no botão <Icon name="plus-circle" /> e depois clique na imagem onde deseja adicionar a marca.
            As marcas são ligadas na ordem em que forem criadas.
          </p>
          <Image src={`${import.meta.env.BASE_URL}images/instructions/create-mark.gif`} alt="Adicionar marca" fluid className="d-block mx-auto my-2" />

          <h4>Editar marca</h4>
          <p>
            Clique no botão <Icon name="puzzle" /> e depois clique na marca que deseja editar. A marca selecionada fica roxa.
          </p>
          <Image src={`${import.meta.env.BASE_URL}images/instructions/edit-mark.gif`} alt="Editar marca" fluid className="d-block mx-auto my-2" />
          <p>
            O primeiro editor é para a <b>cena</b>, com o conteúdo relacionado ao desafio. Em seguida escolha o tipo de
            desafio. Há 5 tipos:
          </p>
          <p><b>Verdadeiro ou falso:</b> escreva a afirmativa e marque a caixa abaixo dela se ela for verdadeira.</p>
          <p>
            <b>Múltipla escolha:</b> escreva a pergunta, adicione as opções com <Icon name="plus-circle-fill" /> e remova
            com <Icon name="trash" />. Marque a opção correta.
          </p>
          <p>
            <b>Preenchimento de lacuna:</b> escreva o texto e coloque entre cifrões as palavras que o jogador deve
            preencher. Por exemplo: “O Brasil é um país $tropical$ e sua capital é $Brasília$.”
          </p>
          <p>
            <b>Associação:</b> escreva a pergunta e adicione os pares: no primeiro campo o item, no segundo o item
            associado.
          </p>
          <p><b>Resposta curta:</b> escreva a pergunta e a resposta correta no campo “Resposta”.</p>
          <p>
            Depois clique em <b>Finalizar edição</b>. Para apagar a marca, clique em <b>Excluir marca</b>.
          </p>

          <h4>Ver todos os desafios</h4>
          <p>
            Mostra a lista de cenas e desafios na ordem do percurso. Use <Icon name="chevron-up" /> e{' '}
            <Icon name="chevron-down" /> para trocar a ordem; clique em um item para editá-lo.
          </p>

          <h4>Mover marca</h4>
          {touch ? (
            <>
              <p>Clique no botão <Icon name="arrows-move" />, toque na marca e depois na nova posição.</p>
              <Image src={`${import.meta.env.BASE_URL}images/instructions/move-mark-mobile.gif`} alt="Mover marca" fluid className="d-block mx-auto my-2" />
            </>
          ) : (
            <>
              <p>Clique na marca e arraste-a para a nova posição.</p>
              <Image src={`${import.meta.env.BASE_URL}images/instructions/move-mark.gif`} alt="Mover marca" fluid className="d-block mx-auto my-2" />
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}

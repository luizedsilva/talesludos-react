// Edição da cena e do desafio de uma marca. Trabalha sobre um rascunho local;
// as alterações só vão para o jogo ao clicar em "Finalizar edição".
import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import RichTextEditor from './RichTextEditor'
import Icon from './Icon'
import { CHALLENGE_TYPES, validateStep } from '../storage/gameModel'

export default function StepEditor({ index, initial, onFinish, onDelete, onCancel }) {
  const [scene, setScene] = useState(initial.scene)
  const [challenge, setChallenge] = useState(initial.challenge)
  const [errors, setErrors] = useState([])
  const number = index + 1
  const type = Number(challenge.type)

  const update = fields => setChallenge(c => ({ ...c, ...fields }))

  const updateOption = (i, text) =>
    update({ options: challenge.options.map((o, k) => (k === i ? { ...o, text } : o)) })
  const removeOption = i => {
    const options = challenge.options.filter((_, k) => k !== i)
    let correct = challenge.correctOptionIndex
    if (correct === i) correct = -1
    else if (correct > i) correct -= 1
    update({ options, correctOptionIndex: correct })
  }

  const updateAssociation = (i, field, value) =>
    update({ associations: challenge.associations.map((a, k) => (k === i ? { ...a, [field]: value } : a)) })
  const removeAssociation = i => update({ associations: challenge.associations.filter((_, k) => k !== i) })

  function finish() {
    const problems = validateStep(scene, challenge)
    setErrors(problems)
    if (problems.length === 0) onFinish(scene, challenge)
  }

  return (
    <div className="border rounded p-3 my-3 bg-white">
      <h4>Descrição da cena {number}</h4>
      <RichTextEditor value={scene} onChange={setScene} />

      <h4 className="mt-4">Desafio {number}</h4>
      <Form.Select
        className="w-auto bg-primary text-white mb-3"
        value={type}
        onChange={e => update({ type: Number(e.target.value) })}
        aria-label="Tipo de desafio"
      >
        <option value={0}>Escolha o tipo de pergunta</option>
        {CHALLENGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Form.Select>

      {type !== 0 && <RichTextEditor value={challenge.content} onChange={content => update({ content })} />}

      {type === 1 && (
        <Form.Check
          className="my-2"
          id={`correct-${number}`}
          label="Marque se a afirmativa estiver correta"
          checked={!!challenge.correct}
          onChange={e => update({ correct: e.target.checked })}
        />
      )}

      {type === 2 && (
        <div className="my-2">
          {challenge.options.map((o, i) => (
            <div key={i} className="d-flex align-items-center gap-2 mb-2 option-row">
              <Form.Check
                type="radio"
                name={`correct-option-${number}`}
                checked={challenge.correctOptionIndex === i}
                onChange={() => update({ correctOptionIndex: i })}
                title="Opção correta"
              />
              <Form.Control size="sm" placeholder="Escreva a opção aqui" value={o.text} onChange={e => updateOption(i, e.target.value)} />
              <Button size="sm" variant="link" onClick={() => removeOption(i)} title="Remover opção"><Icon name="trash" /></Button>
            </div>
          ))}
          <Button size="sm" variant="link" onClick={() => update({ options: [...challenge.options, { text: '' }] })}>
            <Icon name="plus-circle-fill" /> Adicionar opção
          </Button>
          <div className="small text-muted">Marque a opção correta.</div>
        </div>
      )}

      {type === 3 && (
        <Alert variant="secondary" className="my-2 d-flex gap-2 align-items-start">
          <Icon name="info-circle-fill" className="text-primary" />
          <span>
            Para criar um campo de preenchimento de lacuna, coloque a palavra entre cifrões ($).{' '}
            <strong>Por exemplo:</strong> O $céu$ é azul. O jogador deverá preencher o campo com a palavra “céu”.
          </span>
        </Alert>
      )}

      {type === 4 && (
        <div className="my-2">
          {challenge.associations.map((a, i) => (
            <div key={i} className="d-flex align-items-center gap-2 mb-2 option-row">
              <Form.Control size="sm" placeholder="Item" value={a.text} onChange={e => updateAssociation(i, 'text', e.target.value)} />
              <Icon name="arrow-right" />
              <Form.Control size="sm" placeholder="Item associado" value={a.associated} onChange={e => updateAssociation(i, 'associated', e.target.value)} />
              <Button size="sm" variant="link" onClick={() => removeAssociation(i)} title="Remover associação"><Icon name="trash" /></Button>
            </div>
          ))}
          <Button size="sm" variant="link" onClick={() => update({ associations: [...challenge.associations, { text: '', associated: '' }] })}>
            <Icon name="plus-circle-fill" /> Adicionar associação
          </Button>
        </div>
      )}

      {type === 5 && (
        <Form.Group className="my-2 d-flex align-items-center gap-2 option-row" controlId={`answer-${number}`}>
          <Form.Label className="mb-0">Resposta</Form.Label>
          <Form.Control size="sm" placeholder="Escreva a resposta aqui" value={challenge.answer} onChange={e => update({ answer: e.target.value })} />
        </Form.Group>
      )}

      {errors.length > 0 && (
        <Alert variant="danger" className="mt-3 mb-0 py-2">
          Corrija antes de finalizar: {errors.join('; ')}.
        </Alert>
      )}

      <div className="d-flex gap-2 mt-3 flex-wrap">
        <Button onClick={finish}>Finalizar edição</Button>
        {onCancel && <Button variant="light" onClick={onCancel}>Cancelar</Button>}
        <Button variant="outline-danger" onClick={onDelete}><Icon name="trash" /> Excluir marca</Button>
      </div>
    </div>
  )
}

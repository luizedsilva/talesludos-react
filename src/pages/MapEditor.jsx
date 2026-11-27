import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, ToggleButton } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import GameCanvas from '../components/GameCanvas'
import StepEditor from '../components/StepEditor'
import ConfirmDialog from '../components/ConfirmDialog'
import MapInstructions from '../components/MapInstructions'
import Icon from '../components/Icon'
import { loadProject, saveProject } from '../storage/project'
import {
  normalizeGame, addMark, moveMark, deleteMark, swapSteps, getStep, setStep,
  missingSteps, challengeTypeLabel
} from '../storage/gameModel'
import { saveProjectToFile, exportGameZip, openPreview } from '../storage/actions'
import { isTouchDevice, errorMessage } from '../utils'

const AUTOSAVE_MS = 1500

export default function MapEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null) // dados do projeto (sem alterações do jogo)
  const [game, setGame] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [mode, setMode] = useState('add')
  const [selected, setSelected] = useState(-1)
  const [showAll, setShowAll] = useState(false)
  const [openStep, setOpenStep] = useState(-1) // etapa aberta na lista "todos os desafios"
  const [toDelete, setToDelete] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [savedAt, setSavedAt] = useState('')
  const touch = isTouchDevice()

  // ---- carregar -----------------------------------------------------------
  useEffect(() => {
    let url = ''
    loadProject(id)
      .then(p => {
        if (!p) {
          toast.error('Jogo não encontrado neste navegador')
          navigate('/jogos')
          return
        }
        if (p.image) {
          url = URL.createObjectURL(p.image)
          setImageUrl(url)
        } else {
          toast('O jogo não tem imagem de fundo. Escolha uma em Editar dados.', { icon: '⚠️' })
        }
        setProject(p)
        setGame(normalizeGame(p.game))
      })
      .catch(err => toast.error(errorMessage(err)))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [id, navigate])

  // ---- gravação ------------------------------------------------------------
  const latest = useRef({ project: null, game: null })
  latest.current = { project, game }
  const timer = useRef(null)
  const dirty = useRef(false)

  const persist = useCallback(async () => {
    clearTimeout(timer.current)
    timer.current = null
    const { project: p, game: g } = latest.current
    if (!p || !g) return null
    dirty.current = false
    const saved = await saveProject({ ...p, game: g })
    setSavedAt(new Date(saved.updatedAt).toLocaleTimeString('pt-BR'))
    return saved
  }, [])

  // Gravação automática após cada alteração no jogo.
  const changeGame = useCallback(fn => {
    setGame(g => fn(g))
    dirty.current = true
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      persist().catch(err => console.error('Falha na gravação automática', err))
    }, AUTOSAVE_MS)
  }, [persist])

  // Ao sair da página, grava o que estiver pendente.
  useEffect(() => () => {
    if (dirty.current) persist().catch(err => console.error(err))
  }, [persist])

  if (!project || !game) return null

  const missing = missingSteps(game)

  // ---- ações no mapa ---------------------------------------------------------
  function chooseMode(m) {
    setMode(m)
    setSelected(-1)
    setShowAll(false)
    setOpenStep(-1)
  }

  function finishStep(index, scene, challenge) {
    changeGame(g => setStep(g, index, scene, challenge))
    setSelected(-1)
    setOpenStep(-1)
    toast.success(`Etapa ${index + 1} finalizada`)
  }

  function confirmDelete(ok) {
    const index = toDelete
    setToDelete(-1)
    if (!ok) return
    changeGame(g => deleteMark(g, index))
    setSelected(-1)
    setOpenStep(-1)
  }

  function moveStep(index, delta) {
    changeGame(g => swapSteps(g, index, index + delta))
    if (openStep === index) setOpenStep(index + delta)
    else if (openStep === index + delta) setOpenStep(index)
  }

  // ---- botões de gravar / visualizar / exportar -------------------------------
  function warnIfIncomplete() {
    if (game.marks.coords.length === 0) {
      toast('O jogo ainda não tem nenhuma marca no mapa', { icon: '⚠️' })
      return false
    }
    if (missing.length) {
      toast(`Marcas sem desafio: ${missing.map(i => i + 1).join(', ')}`, { icon: '⚠️' })
      return false
    }
    return true
  }

  async function run(task, errorTitle) {
    setBusy(true)
    try {
      await task()
    } catch (err) {
      console.error(err)
      toast.error(`${errorTitle}: ${errorMessage(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const onSave = () => run(async () => {
    await persist()
    if (warnIfIncomplete()) toast.success('Gravado com sucesso')
  }, 'Erro ao gravar')

  const onPreview = () => {
    warnIfIncomplete()
    return run(() => openPreview(project, persist), 'Erro ao visualizar')
  }

  const onSaveFile = () => run(async () => {
    await saveProjectToFile(await persist())
  }, 'Erro ao salvar arquivo')

  const onExport = () => run(async () => {
    warnIfIncomplete()
    await exportGameZip(await persist())
  }, 'Erro ao exportar')

  // ---- interface -------------------------------------------------------------
  const modes = [
    { value: 'add', icon: 'plus-circle', title: 'Adicionar marca' },
    { value: 'edit', icon: 'puzzle', title: 'Editar cena e desafio de uma marca' },
    ...(touch ? [{ value: 'move', icon: 'arrows-move', title: 'Mover marca' }] : [])
  ]

  return (
    <div>
      <h2>{project.title}</h2>
      <p>
        Com a imagem de fundo escolhida, defina a dinâmica do jogo. Clique em <strong>Instruções</strong> para uma
        explicação detalhada de cada opção do menu abaixo.
      </p>
      <MapInstructions />
      <hr />

      <div className="d-flex gap-2 flex-wrap align-items-center">
        <ButtonGroup>
          {modes.map(m => (
            <ToggleButton
              key={m.value}
              id={`mode-${m.value}`}
              type="radio"
              variant="outline-primary"
              name="mode"
              value={m.value}
              checked={mode === m.value && !showAll}
              onChange={() => chooseMode(m.value)}
              title={m.title}
              className="icon-btn"
            >
              <Icon name={m.icon} />
            </ToggleButton>
          ))}
        </ButtonGroup>
        <Button
          variant={showAll ? 'primary' : 'outline-primary'}
          size="sm"
          disabled={game.marks.coords.length === 0}
          onClick={() => { setShowAll(s => !s); setSelected(-1); setOpenStep(-1) }}
        >
          <Icon name="list-ol" /> Ver todos os desafios
        </Button>
        <span className="small text-muted">
          {mode === 'add' && 'Clique na imagem para adicionar marcas; arraste uma marca para movê-la.'}
          {mode === 'edit' && 'Clique em uma marca para editar a cena e o desafio.'}
          {mode === 'move' && 'Toque na marca e depois na nova posição.'}
        </span>
      </div>

      {imageUrl && (
        <GameCanvas
          imageUrl={imageUrl}
          marks={game.marks.coords}
          missing={missing}
          mode={mode}
          selected={showAll ? openStep : selected}
          onAdd={(x, y) => changeGame(g => addMark(g, x, y))}
          onSelect={i => { setShowAll(false); setSelected(i) }}
          onMove={(i, x, y) => changeGame(g => moveMark(g, i, x, y))}
        />
      )}
      {game.marks.coords.length > 0 && (
        <div className="trilha-legenda" aria-label="Legenda da trilha">
          <span><i className="trilha-no trilha-no-pronto" />Local pronto</span>
          <span><i className="trilha-no trilha-no-incompleto" />Sem desafio</span>
          <span><i className="trilha-no trilha-no-selecionado" />Selecionado</span>
          <span className="text-body-secondary">O jogador percorre a trilha na ordem dos números.</span>
        </div>
      )}
      {missing.length > 0 && (
        <p className="small text-danger mb-1">
          Marcas com borda vermelha ainda não têm desafio: {missing.map(i => i + 1).join(', ')}.
        </p>
      )}

      {/* edição da marca selecionada no mapa */}
      {!showAll && mode === 'edit' && selected !== -1 && (
        <StepEditor
          key={`sel-${selected}`}
          index={selected}
          initial={getStep(game, selected)}
          onFinish={(scene, challenge) => finishStep(selected, scene, challenge)}
          onDelete={() => setToDelete(selected)}
          onCancel={() => setSelected(-1)}
        />
      )}

      {/* lista de todas as etapas */}
      {showAll && (
        <div className="my-3">
          {game.marks.coords.map((_, i) => {
            const step = game.challenges.find(c => c.id === i + 1)
            return (
              <Card key={i} className="mb-2">
                <Card.Header className="d-flex align-items-center gap-2">
                  <div
                    className="challenge-card-header flex-grow-1"
                    onClick={() => setOpenStep(openStep === i ? -1 : i)}
                  >
                    <Icon name={openStep === i ? 'dash-lg' : 'plus-lg'} />{' '}
                    <strong>Cena e desafio {i + 1}</strong>{' '}
                    {step
                      ? <Badge bg="secondary">{challengeTypeLabel(step.type)}</Badge>
                      : <Badge bg="danger">sem desafio</Badge>}
                  </div>
                  <Button size="sm" variant="light" disabled={i === 0} onClick={() => moveStep(i, -1)} title="Mover para cima">
                    <Icon name="chevron-up" />
                  </Button>
                  <Button size="sm" variant="light" disabled={i === game.marks.coords.length - 1} onClick={() => moveStep(i, 1)} title="Mover para baixo">
                    <Icon name="chevron-down" />
                  </Button>
                </Card.Header>
                {openStep === i && (
                  <Card.Body className="p-0 px-2">
                    <StepEditor
                      key={`list-${i}-${step ? step.type : 0}`}
                      index={i}
                      initial={getStep(game, i)}
                      onFinish={(scene, challenge) => finishStep(i, scene, challenge)}
                      onDelete={() => setToDelete(i)}
                      onCancel={() => setOpenStep(-1)}
                    />
                  </Card.Body>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <div className="d-flex gap-2 flex-wrap align-items-center my-3">
        <Button onClick={onSave} disabled={busy}><Icon name="check2" /> Gravar</Button>
        <Button variant="success" onClick={onPreview} disabled={busy}><Icon name="controller" /> Visualizar</Button>
        <Button variant="secondary" onClick={onSaveFile} disabled={busy}><Icon name="save" /> Salvar projeto em arquivo</Button>
        <Button variant="warning" onClick={onExport} disabled={busy}><Icon name="file-earmark-zip" /> Exportar jogo (.zip)</Button>
        <Button variant="light" as={Link} to="/jogos">Voltar à lista</Button>
        {savedAt && <small className="text-muted">Gravado às {savedAt}</small>}
      </div>

      <ConfirmDialog
        show={toDelete !== -1}
        title="Excluir marca"
        options={[
          { label: 'Não', value: false },
          { label: 'Sim, excluir', value: true, variant: 'danger' }
        ]}
        onClose={confirmDelete}
      >
        Excluir a marca {toDelete + 1} junto com a cena e o desafio dela? As marcas seguintes serão renumeradas.
      </ConfirmDialog>
    </div>
  )
}

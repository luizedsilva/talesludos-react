import { useEffect, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import ConfirmDialog from '../components/ConfirmDialog'
import { AREAS, loadProject, removeProject } from '../storage/project'
import { errorMessage } from '../utils'

export default function GameDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [confirm, setConfirm] = useState(false)

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
        }
        setProject(p)
      })
      .catch(err => toast.error(errorMessage(err)))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [id, navigate])

  if (!project) return null
  const area = AREAS.find(a => a.id === project.areaId)

  function onConfirm(value) {
    setConfirm(false)
    if (!value) return
    removeProject(id)
      .then(() => navigate('/jogos'))
      .catch(err => toast.error('Erro ao excluir o jogo: ' + errorMessage(err)))
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <Card body>
        <div className="d-flex gap-3 align-items-start mb-3">
          {imageUrl && <img src={imageUrl} style={{ width: 150 }} alt="Imagem do jogo" />}
          <div>
            {area && <p className="text-muted">Área: {area.title}</p>}
            <div dangerouslySetInnerHTML={{ __html: project.description }} />
          </div>
        </div>
        <Button onClick={() => navigate('/jogos')} className="me-2">Voltar</Button>
        <Button variant="danger" onClick={() => setConfirm(true)}>Excluir</Button>
      </Card>

      <ConfirmDialog
        show={confirm}
        title="Excluir jogo"
        options={[
          { label: 'Não', value: false },
          { label: 'Sim, excluir', value: true, variant: 'danger' }
        ]}
        onClose={onConfirm}
      >
        Deseja realmente excluir o jogo <b>{project.title}</b>? Se você não salvou o projeto em arquivo, ele será
        perdido.
      </ConfirmDialog>
    </div>
  )
}

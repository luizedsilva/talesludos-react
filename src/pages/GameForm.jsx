import { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import RichTextEditor from '../components/RichTextEditor'
import { AREAS, newProject, loadProject, saveProject } from '../storage/project'
import { errorMessage } from '../utils'

export default function GameForm() {
  const { id } = useParams()
  const isNew = id === 'novo'
  const navigate = useNavigate()
  const [project, setProject] = useState(() => (isNew ? newProject() : null))
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Carrega o projeto existente.
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    loadProject(id)
      .then(p => {
        if (cancelled) return
        if (!p) {
          toast.error('Jogo não encontrado neste navegador')
          navigate('/jogos')
          return
        }
        setProject(p)
      })
      .catch(err => toast.error(errorMessage(err)))
    return () => { cancelled = true }
  }, [id, isNew, navigate])

  // URL temporária para mostrar a imagem escolhida.
  useEffect(() => {
    if (!project || !project.image) {
      setImageUrl('')
      return
    }
    const url = URL.createObjectURL(project.image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [project && project.image])

  if (!project) return null

  const update = fields => setProject(p => ({ ...p, ...fields }))

  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    // Guarda como Blob simples (portável para o IndexedDB e para o arquivo de projeto).
    update({ image: new Blob([file], { type: file.type }), imageName: file.name })
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!project.image) {
      toast.error('A escolha da IMAGEM é obrigatória')
      return
    }
    setSaving(true)
    try {
      const saved = await saveProject(project)
      navigate(`/jogos/${saved.id}/mapa`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gravar o jogo: ' + errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="container">
      <h1>{isNew ? 'Novo jogo' : 'Editar jogo'}</h1>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="titulo">
          <Form.Label>Título:</Form.Label>
          <Form.Control
            type="text"
            required
            placeholder="Digite o título"
            value={project.title}
            onChange={e => update({ title: e.target.value })}
          />
          <Form.Text>Digite um título para o jogo</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrição:</Form.Label>
          <RichTextEditor value={project.description} onChange={html => update({ description: html })} />
          <Form.Text>Digite uma apresentação do jogo</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="imagem">
          <Form.Label>Imagem</Form.Label>
          <Form.Control type="file" accept="image/jpeg, image/png" onChange={onFileChange} isValid={!!project.image} />
          <Form.Text>
            Escolha imagem de fundo do jogo{project.imageName ? ` (atual: ${project.imageName})` : ''}
          </Form.Text>
          {imageUrl && <img src={imageUrl} className="d-block p-3" width={200} alt="Imagem de fundo" />}
        </Form.Group>

        <Form.Group className="mb-3" controlId="area">
          <Form.Label>Área:</Form.Label>
          <Form.Select
            required
            value={project.areaId ?? ''}
            onChange={e => update({ areaId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="" disabled>Escolha a área</option>
            {AREAS.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Form.Select>
          <Form.Text>Escolha a área de conhecimento relacionada ao jogo</Form.Text>
        </Form.Group>

        <Button type="submit" disabled={saving} className="me-2">Gravar e editar o mapa</Button>
        <Button variant="warning" onClick={() => navigate('/jogos')}>Cancelar</Button>
      </Form>
    </div>
  )
}

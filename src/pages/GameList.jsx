import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import ListInstructions from '../components/ListInstructions'
import { listProjects, loadProject, newProject, saveProject } from '../storage/project'
import { readProjectFile, PROJECT_EXT } from '../storage/files'
import { saveProjectToFile, exportGameZip, openPreview } from '../storage/actions'
import { errorMessage } from '../utils'

function formatDate(ts) {
  return ts ? new Date(ts).toLocaleString('pt-BR') : ''
}

export default function GameList() {
  const [projects, setProjects] = useState(null)
  const [conflict, setConflict] = useState(null) // { incoming, existing }
  const fileInput = useRef(null)

  const refresh = useCallback(() => {
    return listProjects()
      .then(setProjects)
      .catch(err => {
        setProjects([])
        toast.error('Erro ao listar os jogos: ' + errorMessage(err))
      })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const fail = title => err => {
    console.error(err)
    toast.error(`${title}: ${errorMessage(err)}`)
  }

  async function importProject(project) {
    await saveProject(project)
    await refresh()
    toast.success(`"${project.title}" aberto`)
  }

  async function onOpenFile(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    try {
      const project = await readProjectFile(file)
      const existing = await loadProject(project.id)
      if (existing) setConflict({ incoming: project, existing })
      else await importProject(project)
    } catch (err) {
      fail('Erro ao abrir projeto')(err)
    }
  }

  function resolveConflict(choice) {
    const { incoming } = conflict
    setConflict(null)
    if (choice === 'replace') {
      importProject(incoming).catch(fail('Erro ao abrir projeto'))
    } else if (choice === 'copy') {
      const fresh = newProject()
      importProject({ ...incoming, id: fresh.id, title: `${incoming.title} (cópia)`, createdAt: fresh.createdAt })
        .catch(fail('Erro ao abrir projeto'))
    }
  }

  function exportZip(project) {
    const id = toast.loading('Gerando o pacote do jogo...')
    exportGameZip(project)
      .then(() => toast.success('Jogo exportado', { id }))
      .catch(err => { toast.dismiss(id); fail('Erro ao exportar')(err) })
  }

  return (
    <div>
      <h1>Meus jogos</h1>
      <ListInstructions />
      <hr />

      <div className="mb-3 d-flex gap-2 flex-wrap">
        <Button as={Link} to="/jogos/novo/dados">
          Novo jogo <Icon name="file-earmark-plus" />
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current.click()}>
          Abrir projeto <Icon name="folder2-open" />
        </Button>
        <input ref={fileInput} type="file" accept={PROJECT_EXT} className="d-none" onChange={onOpenFile} />
      </div>

      <p className="text-muted small">
        Os jogos ficam guardados neste navegador. Use <Icon name="save" /> para salvar o projeto em um arquivo{' '}
        <code>{PROJECT_EXT}</code> (cópia de segurança ou para continuar em outro computador) e{' '}
        <Icon name="file-earmark-zip" /> para exportar o jogo pronto para publicar.
      </p>

      <Table bordered size="sm" responsive>
        <thead className="table-light">
          <tr>
            <th>Título</th>
            <th style={{ width: 170 }}>Alterado em</th>
            <th style={{ width: 310 }}>Opções</th>
          </tr>
        </thead>
        <tbody>
          {projects === null && (
            <tr><td colSpan={3} className="text-center text-danger py-2">
              <Spinner size="sm" className="me-2" /> carregando...
            </td></tr>
          )}
          {projects && projects.length === 0 && (
            <tr><td colSpan={3} className="text-center text-muted py-2">
              Nenhum jogo ainda. Crie um novo jogo ou abra um arquivo de projeto.
            </td></tr>
          )}
          {projects && projects.map(p => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{formatDate(p.updatedAt)}</td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  <Button size="sm" className="icon-btn" title="Editar dados" as={Link} to={`/jogos/${p.id}/dados`}>
                    <Icon name="pencil" />
                  </Button>
                  <Button size="sm" className="icon-btn" variant="info" title="Editar mapa e desafios" as={Link} to={`/jogos/${p.id}/mapa`}>
                    <Icon name="geo-alt" />
                  </Button>
                  <Button size="sm" className="icon-btn" variant="light" title="Detalhes" as={Link} to={`/jogos/${p.id}`}>
                    <Icon name="eye" />
                  </Button>
                  <Button size="sm" className="icon-btn" variant="success" title="Visualizar o jogo"
                    onClick={() => openPreview(p).catch(fail('Erro ao visualizar'))}>
                    <Icon name="controller" />
                  </Button>
                  <Button size="sm" className="icon-btn" variant="secondary" title="Salvar projeto em arquivo"
                    onClick={() => saveProjectToFile(p).catch(fail('Erro ao salvar arquivo'))}>
                    <Icon name="save" />
                  </Button>
                  <Button size="sm" className="icon-btn" variant="warning" title="Exportar jogo (.zip)" onClick={() => exportZip(p)}>
                    <Icon name="file-earmark-zip" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <ConfirmDialog
        show={!!conflict}
        title="Jogo já existe"
        options={[
          { label: 'Cancelar', value: null },
          { label: 'Abrir como cópia', value: 'copy', variant: 'primary' },
          { label: 'Substituir', value: 'replace', variant: 'danger' }
        ]}
        onClose={resolveConflict}
      >
        {conflict && (
          <p className="mb-0">
            O jogo <b>{conflict.existing.title}</b> já está neste navegador. Deseja substituí-lo pela versão do
            arquivo ou abrir o arquivo como uma cópia?
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

// Modelo de um projeto TalesLudos e operações sobre ele.
//
// Formato guardado no IndexedDB:
// {
//   id, title, description (HTML), areaId,
//   image: Blob, imageName,
//   game: { marks: {coords, nextMark}, links, scenes, challenges },
//   createdAt, updatedAt
// }

import { getProject, getAllProjects, putProject, deleteProject } from './db'

export const AREAS = [
  { id: 1, title: 'Ciências Exatas e da Terra' },
  { id: 2, title: 'Ciências Biológicas' },
  { id: 3, title: 'Engenharia/Tecnologia' },
  { id: 4, title: 'Ciências da Saúde' },
  { id: 5, title: 'Ciências Agrárias' },
  { id: 6, title: 'Ciências Sociais' },
  { id: 7, title: 'Ciências Humanas' },
  { id: 8, title: 'Linguística' },
  { id: 9, title: 'Letras e Artes' }
]

export function emptyGame() {
  return {
    marks: { coords: [], nextMark: 1 },
    links: [],
    scenes: [],
    challenges: []
  }
}

function newId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function newProject({ title = '', description = '', areaId = null, image = null, imageName = '' } = {}) {
  const now = Date.now()
  return {
    id: newId(),
    title,
    description,
    areaId,
    image,
    imageName,
    game: emptyGame(),
    createdAt: now,
    updatedAt: now
  }
}

// Garante que um objeto vindo de arquivo ou de versões antigas tenha todos os campos.
export function normalizeProject(p) {
  const game = Object.assign(emptyGame(), p.game || {})
  if (!game.marks || !Array.isArray(game.marks.coords)) game.marks = { coords: [], nextMark: 1 }
  return {
    id: p.id || newId(),
    title: p.title || '',
    description: p.description || '',
    areaId: p.areaId ?? null,
    image: p.image || null,
    imageName: p.imageName || '',
    game,
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now()
  }
}

export function loadProject(id) {
  return getProject(id).then(p => (p ? normalizeProject(p) : null))
}

export function listProjects() {
  return getAllProjects().then(list =>
    list.map(normalizeProject).sort((a, b) => b.updatedAt - a.updatedAt)
  )
}

// O IndexedDB só aceita objetos simples (e Blobs): copia o jogo sem referências da interface.
export function saveProject(project) {
  const plain = {
    ...project,
    game: JSON.parse(JSON.stringify(project.game)),
    updatedAt: Date.now()
  }
  return putProject(plain).then(() => plain)
}

export function removeProject(id) {
  return deleteProject(id)
}

// Nome de arquivo seguro a partir do título.
export function slugify(text) {
  const s = (text || 'jogo')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return s || 'jogo'
}

export function downloadBlob(blob, filename) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

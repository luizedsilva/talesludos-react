// Área de trabalho local: os projetos ficam no IndexedDB do navegador
// (semelhante ao eXeLearning online). Nada é enviado a um servidor.
//
// Este mesmo banco é lido por public/game/preview.html para visualizar o jogo,
// por isso DB_NAME, STORE e o formato do projeto devem permanecer compatíveis.

export const DB_NAME = 'talesludos'
export const DB_VERSION = 1
export const STORE = 'projects'

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

function run(mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req && req.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  }))
}

export function getProject(id) {
  return run('readonly', store => store.get(id))
}

export function getAllProjects() {
  return run('readonly', store => store.getAll())
}

export function putProject(project) {
  return run('readwrite', store => store.put(project))
}

export function deleteProject(id) {
  return run('readwrite', store => store.delete(id))
}

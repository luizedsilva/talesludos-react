// Ações sobre um projeto usadas pelas telas (lista e editor).
import { downloadBlob } from './project'
import { buildProjectFile, projectFileName, buildGameZip, gameZipName, previewUrl } from './files'

// Baixa o arquivo de projeto (.tlud), que pode ser reaberto depois para edição.
export async function saveProjectToFile(project) {
  downloadBlob(await buildProjectFile(project), projectFileName(project))
}

// Baixa o jogo pronto para publicar (.zip com index.html e imsmanifest.xml).
export async function exportGameZip(project) {
  downloadBlob(await buildGameZip(project), gameZipName(project))
}

// Abre a visualização em nova aba. "beforeOpen" (opcional) roda antes,
// por exemplo para gravar alterações pendentes. A aba é aberta já no clique
// para não ser barrada pelo bloqueador de pop-ups.
export async function openPreview(project, beforeOpen) {
  const win = window.open('', '_blank')
  try {
    if (beforeOpen) await beforeOpen()
    if (win) win.location.href = previewUrl(project)
    else window.location.href = previewUrl(project)
  } catch (e) {
    if (win) win.close()
    throw e
  }
}

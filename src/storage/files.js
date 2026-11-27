// Arquivos gerados a partir de um projeto:
//  - arquivo de projeto (.tlud): zip com project.json + imagem, para salvar e reabrir a edição;
//  - pacote do jogo (.zip): site estático jogável, com imsmanifest.xml (SCORM 1.2),
//    no mesmo espírito da exportação do eXeLearning.

import JSZip from 'jszip'
import { normalizeProject, slugify } from './project'

export const PROJECT_EXT = '.tlud'
const PROJECT_FORMAT = 'talesludos-project'
const PROJECT_FORMAT_VERSION = 1

// Arquivos do motor do jogo (trilha sobre o mapa), servidos a partir de public/game/.
const RUNTIME_FILES = [
  'js/jogo.js',
  'js/scorm.js',
  'css/jogo.css',
  'font/inter.woff2',
  'font/OFL.txt',
  'media/tales-ludos.svg',
  'media/favicon.svg',
  'media/walk.png',
  'media/idle.png'
]

function runtimeUrl(path) {
  return `${import.meta.env.BASE_URL}game/${path}`
}

function imageExt(project) {
  const fromName = /\.([a-z0-9]+)$/i.exec(project.imageName || '')
  if (fromName) return fromName[1].toLowerCase()
  const type = project.image && project.image.type
  if (type === 'image/png') return 'png'
  return 'jpg'
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
}

// ---------------------------------------------------------------------------
// Arquivo de projeto (.tlud)
// ---------------------------------------------------------------------------

export async function buildProjectFile(project) {
  const zip = new JSZip()
  const imagePath = project.image ? `media/background.${imageExt(project)}` : null
  const meta = {
    format: PROJECT_FORMAT,
    version: PROJECT_FORMAT_VERSION,
    id: project.id,
    title: project.title,
    description: project.description,
    areaId: project.areaId,
    imageName: project.imageName,
    image: imagePath,
    game: project.game,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
  zip.file('project.json', JSON.stringify(meta, null, 2))
  if (imagePath) zip.file(imagePath, project.image)
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
}

export function projectFileName(project) {
  return slugify(project.title) + PROJECT_EXT
}

export async function readProjectFile(file) {
  let zip
  try {
    zip = await JSZip.loadAsync(file)
  } catch (e) {
    throw new Error('O arquivo não é um projeto TalesLudos válido.')
  }
  const entry = zip.file('project.json')
  if (!entry) throw new Error('O arquivo não contém project.json.')
  const meta = JSON.parse(await entry.async('string'))
  if (meta.format !== PROJECT_FORMAT) throw new Error('O arquivo não é um projeto TalesLudos.')
  if (meta.version > PROJECT_FORMAT_VERSION) {
    throw new Error('Este projeto foi criado por uma versão mais nova do TalesLudos.')
  }

  let image = null
  if (meta.image && zip.file(meta.image)) {
    const type = /\.png$/i.test(meta.image) ? 'image/png' : 'image/jpeg'
    const data = await zip.file(meta.image).async('blob')
    image = new Blob([data], { type })
  }
  return normalizeProject({ ...meta, image })
}

// ---------------------------------------------------------------------------
// Pacote do jogo (.zip)
// ---------------------------------------------------------------------------

export function gameScript(project) {
  const introduce = (project.description || '').replace(/\r|\n/g, '')
  const g = project.game
  const data = {
    title: project.title || '',
    introduce,
    marks: g.marks,
    links: (g.links || []).filter(l => !l.removed),
    scenes: g.scenes,
    challenges: g.challenges
  }
  return 'var game = ' + JSON.stringify(data, null, 2) + ';\n'
}

function gameIndexHtml(project, imageFile) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(project.title || 'Tales Ludos')}</title>
  <link rel="icon" href="media/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/jogo.css">
</head>
<body>
  <img id="mapa" src="media/${imageFile}" alt="" hidden>
  <script src="config/game.js"></script>
  <script src="js/scorm.js"></script>
  <script src="js/jogo.js"></script>
</body>
</html>
`
}

function imsManifest(project, files) {
  const title = escapeXml(project.title || 'TalesLudos')
  const fileList = files.map(f => `      <file href="${escapeXml(f)}"/>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="TalesLudos-${escapeXml(project.id)}" version="1.2"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1">
      <title>${title}</title>
      <item identifier="ITEM-1" identifierref="RES-1">
        <title>${title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileList}
    </resource>
  </resources>
</manifest>
`
}

export async function buildGameZip(project) {
  if (!project.image) throw new Error('O projeto não tem imagem de fundo.')

  const zip = new JSZip()
  await Promise.all(RUNTIME_FILES.map(async path => {
    const res = await fetch(runtimeUrl(path))
    if (!res.ok) throw new Error(`Não foi possível ler o arquivo do motor do jogo: ${path}`)
    zip.file(path, await res.blob())
  }))

  const imageFile = `mapa.${imageExt(project)}`
  zip.file(`media/${imageFile}`, project.image)
  zip.file('config/game.js', gameScript(project))
  zip.file('index.html', gameIndexHtml(project, imageFile))

  const files = ['index.html', 'config/game.js', `media/${imageFile}`, ...RUNTIME_FILES]
  zip.file('imsmanifest.xml', imsManifest(project, files))

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' })
}

export function gameZipName(project) {
  return slugify(project.title) + '.zip'
}

// Abre a visualização local (public/game/preview.html lê o projeto do IndexedDB).
export function previewUrl(project) {
  return `${import.meta.env.BASE_URL}game/preview.html?id=${encodeURIComponent(project.id)}`
}

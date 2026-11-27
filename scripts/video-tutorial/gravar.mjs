// Grava o vídeo tutorial do Tales Ludos construindo o jogo "Noite estrelada de Van Gogh".
// Normalmente é chamado pelo gravar.sh, que também faz o build, o corte e o MP4 final.
//
// Uso: node gravar.mjs [url-base] [pasta-com-imagens] [pasta-de-saida]
//   url-base: o site servido por "npm run preview" (padrão http://localhost:4173/)
//   pasta-com-imagens: noite-estrelada.jpg (fundo) e van-gogh.jpg (imagem da apresentação);
//     padrão: a pasta imagens/ ao lado deste script
//   CHROME: variável de ambiente com o caminho do Chrome (padrão /usr/bin/google-chrome)
//
// Grava em três arquivos na pasta de saída: parte1.webm (até o 1º local), parte2.webm (locais 2 a 4,
// que o gravar.sh acelera) e parte3.webm (do jogo até o fim). Separar em arquivos deixa o corte exato:
// o atraso entre o relógio do script e o tempo do vídeo varia de uma gravação para outra.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const [BASE = 'http://localhost:4173/', ASSETS = path.join(HERE, 'imagens'), OUT = '.'] = process.argv.slice(2)
const W = 1280
const H = 720
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---- conteúdo do jogo (do pacote exportado original) --------------------------------
const GAME = {
  title: 'Noite estrelada de Van Gogh',
  intro1: 'Considerado um dos artistas mais influentes da história da arte, Vincent Willem van Gogh foi um pintor ' +
    'pós-impressionista holandês nascido em 30 de março de 1853. Talentoso e genial, Vincent enfrentou diversos ' +
    'problemas de saúde e solidão e, apesar de não ter tido reconhecimento em vida, foi na arte que encontrou o amor ' +
    'que tanto procurava.',
  intro2: 'Neste jogo, estudaremos a obra "Noite estrelada" de Vincent Van Gogh.',
  marks: [
    { x: 0.0865, y: 0.7354 },
    { x: 0.3099, y: 0.2154 },
    { x: 0.5775, y: 0.6987 },
    { x: 0.8477, y: 0.2987 }
  ],
  steps: [
    {
      scene: 'A Noite Estrelada é uma pintura de Vincent van Gogh de 1889. A obra retrata a vista da janela de um quarto ' +
        'do hospício de Saint-Rémy-de-Provence, pouco antes do nascer do sol, com a adição de um vilarejo idealizado ' +
        'pelo artista. A tela faz parte da coleção permanente do Museu de Arte Moderna de Nova Iorque desde 1941. É ' +
        'considerada uma das mais famosas pinturas de Van Gogh e uma das mais icônicas da arte ocidental.',
      question: 'A pintura retrata a vista da janela do hospício de Saint-Rémy-de-Provence?',
      options: ['Sim', 'Não'],
      correct: 0
    },
    {
      scene: 'Van Gogh pintou a vista da janela em diferentes períodos do dia, sob várias condições, como na alvorada, ' +
        'anoitecer, dias ensolarados, nublados, ventosos e num dia chuvoso. O elemento pictórico em comum a todas ' +
        'essas pinturas e desenhos é a linha diagonal que representa as baixas colinas dos Alpilles.',
      question: 'Van Gogh pintou o quadro durante vários períodos do dia e sob diferentes condições climáticas?',
      options: ['Não', 'Sim'],
      correct: 1
    },
    {
      scene: 'A Noite Estrelada é a única noturna da série de obras da vista do quarto do hospício. Pesquisadores ' +
        'concluíram que a "estrela" mais brilhante da pintura, logo à direita do cipreste, é Vênus, o segundo ' +
        'planeta do Sistema Solar.',
      question: 'É possível afirmarmos que essa não é a única pintura que retrata a noite da série de pinturas de Van ' +
        'Gogh feitas da janela do hospício?',
      options: ['Sim', 'Não'],
      correct: 1
    },
    {
      scene: 'A lua foi uma estilização, pois registros astronômicos indicam que o astro estivera minguante giboso ' +
        'quando Van Gogh produziu a tela. O único elemento definitivamente fora do alcance daquela vista é o ' +
        'vilarejo, que teve por base um rascunho feito a partir de uma encosta acima de Saint-Rémy.',
      question: 'A representação da Lua feita por Van Gogh se trata de uma estilização por parte do pintor?',
      options: ['Sim, porque ela era minguante no momento da pintura.', 'Não. Ela era, de fato, uma lua cheia.'],
      correct: 0
    }
  ]
}

// ---- camada sobreposta: legenda, cursor e cartões (cores da marca) ----------------------
const OVERLAY = () => {
  const css = `
    #tl-cap{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);max-width:1060px;z-index:2147483646;
      background:rgba(44,29,99,.94);color:#fff;font:600 25px/1.35 Inter,system-ui,sans-serif;padding:13px 26px;
      border-radius:14px;text-align:center;transition:opacity .35s;opacity:0;pointer-events:none}
    #tl-cap.on{opacity:1}
    #tl-cap b{color:#f39a75}
    html.tl-game #tl-cap{left:14px;bottom:auto;top:50%;transform:translateY(-50%);width:205px;max-width:205px;font-size:19px;padding:14px 16px;text-align:left}
    #tl-cur{position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;
      transition:transform .7s cubic-bezier(.45,.05,.25,1)}
    #tl-cur svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
    .tl-ripple{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;z-index:2147483646;
      border:3px solid #e57145;pointer-events:none;animation:tlr .55s ease-out forwards}
    @keyframes tlr{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}
    #tl-card{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:#5a3aba;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center;
      transition:opacity .6s;opacity:0;pointer-events:none;padding:40px}
    #tl-card.on{opacity:1}
    #tl-card.on ~ #tl-cur{opacity:0}
    #tl-card img{height:150px;margin-bottom:34px}
    #tl-card h1{font-size:52px;font-weight:800;margin:0 0 16px;letter-spacing:-.02em}
    #tl-card p{font-size:27px;margin:0;opacity:.9}
    #tl-card .url{margin-top:30px;background:#e57145;color:#2c1d63;font-weight:800;padding:12px 28px;border-radius:999px;font-size:25px}
  `
  const root = () => document.documentElement
  const init = () => {
    if (document.getElementById('tl-cur')) return
    if (!document.querySelector('link[href*="family=Inter"]')) {
      const f = document.createElement('link'); f.rel = 'stylesheet'
      f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap'; root().appendChild(f)
    }
    const st = document.createElement('style'); st.textContent = css; root().appendChild(st)
    const cap = document.createElement('div'); cap.id = 'tl-cap'; root().appendChild(cap)
    const card = document.createElement('div'); card.id = 'tl-card'; root().appendChild(card)
    const cur = document.createElement('div'); cur.id = 'tl-cur'
    cur.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l15 9.5-6.6 1.3 3.9 7.4-2.6 1.4-3.9-7.5L4 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'
    root().appendChild(cur)
    const saved = JSON.parse(sessionStorage.getItem('tl-cur') || '[640,360]')
    cur.style.transition = 'none'
    cur.style.transform = `translate(${saved[0]}px,${saved[1]}px)`
    requestAnimationFrame(() => { cur.style.transition = '' })
  }
  window.__tl = {
    init,
    cursor(x, y, ms = 700) {
      init()
      const cur = document.getElementById('tl-cur')
      cur.style.transitionDuration = ms + 'ms'
      cur.style.transform = `translate(${x}px,${y}px)`
      sessionStorage.setItem('tl-cur', JSON.stringify([x, y]))
    },
    ripple(x, y) {
      const r = document.createElement('div'); r.className = 'tl-ripple'
      r.style.left = x + 'px'; r.style.top = y + 'px'; root().appendChild(r)
      setTimeout(() => r.parentNode && r.parentNode.removeChild(r), 600)
    },
    caption(html) {
      init()
      const cap = document.getElementById('tl-cap')
      if (!html) { cap.classList.remove('on'); return }
      cap.innerHTML = html; cap.classList.add('on')
    },
    gameMode() {
      root().classList.add('tl-game')
    },
    card(html, instant) {
      init()
      const card = document.getElementById('tl-card')
      if (!html) { card.classList.remove('on'); return }
      if (instant) { card.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { card.style.transition = '' })) }
      card.innerHTML = html; card.classList.add('on')
    }
  }
  window.open = () => window // visualização na mesma aba, para seguir na gravação
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: 'new',
  args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--lang=pt-BR']
})
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument(OVERLAY)
const cdp = await page.createCDPSession()
await cdp.send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {})

let cx = 640, cy = 360
let SPEED = 650
const tl = (fn, ...args) => page.evaluate((fn, args) => window.__tl[fn](...args), fn, args)
const caption = async (html, hold = 0) => { await tl('caption', html); if (hold) await sleep(hold) }
const card = async (html, hold = 0) => { await tl('card', html); if (hold) await sleep(hold) }
const LOGO = `${BASE}images/marca/logo-fundo-colorido.svg`

async function moveTo(x, y, ms = SPEED) {
  await tl('cursor', x, y, ms)
  const steps = 12
  for (let i = 1; i <= steps; i++) await page.mouse.move(cx + ((x - cx) * i) / steps, cy + ((y - cy) * i) / steps)
  cx = x; cy = y
  await sleep(ms + 80)
}

async function centerOf(target) {
  const el = typeof target === 'string' ? await page.waitForSelector(target, { visible: true }) : target
  await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  await sleep(SPEED < 600 ? 450 : 650)
  const b = await el.boundingBox()
  return { el, x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }
}

async function dragTo(fromX, fromY, toX, toY, steps = 28) {
  await moveTo(fromX, fromY)
  await tl('ripple', fromX, fromY)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    const x = fromX + ((toX - fromX) * i) / steps
    const y = fromY + ((toY - fromY) * i) / steps
    await tl('cursor', x, y, 40)
    await page.mouse.move(x, y)
    await sleep(45)
  }
  await page.mouse.up()
  cx = toX; cy = toY
  await sleep(400)
}

async function clickAt(x, y) {
  await moveTo(x, y)
  await tl('ripple', x, y)
  await page.mouse.click(x, y)
  await sleep(300)
}

async function click(target) {
  const { x, y } = await centerOf(target)
  await clickAt(x, y)
}

async function byText(text, sel = 'a,button,label') {
  const handle = await page.waitForFunction((text, sel) =>
    [...document.querySelectorAll(sel)].find(e => e.offsetParent !== null && e.textContent.trim().includes(text)),
  { timeout: 20000 }, text, sel)
  return handle.asElement()
}

const type = (text, delay = 40) => page.keyboard.type(text, { delay })
// Texto longo: digita o começo e "cola" o resto, como faria o autor.
async function typeLong(text, visible = 60) {
  await type(text.slice(0, visible), 28)
  await page.evaluate(t => document.execCommand('insertText', false, t), text.slice(visible))
  await sleep(500)
}

async function quill(index) {
  const editors = await page.$$('.ql-editor')
  await click(editors[index])
}

async function chooseType(label) {
  const sel = await page.$('select[aria-label="Tipo de desafio"]')
  await click(sel)
  const value = await sel.evaluate((s, label) => [...s.options].find(o => o.text === label).value, label)
  await sel.select(value)
  await sleep(500)
}

const scrollToCanvas = async () => {
  const canvas = await page.$('.map-canvas canvas')
  await canvas.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  await sleep(800)
  return canvas.boundingBox()
}
const markPoint = (box, m) => [Math.round(box.x + m.x * box.width), Math.round(box.y + m.y * box.height)]

async function fillStep(i, { first }) {
  const step = GAME.steps[i]
  SPEED = first ? 650 : 380
  const box = await scrollToCanvas()
  await clickAt(...markPoint(box, GAME.marks[i]))
  await page.waitForSelector('select[aria-label="Tipo de desafio"]', { visible: true })
  if (first) await caption('A <b>cena</b> apresenta o conteúdo daquele local: textos, imagens, links, vídeos.')
  await quill(0)
  await typeLong(step.scene, first ? 70 : 35)
  if (first) await caption('Depois, escolha o tipo de <b>desafio</b>. Aqui, <b>múltipla escolha</b>.')
  await chooseType('Múltipla escolha')
  await quill(1)
  await typeLong(step.question, first ? 999 : 30)
  const inputs = await page.$$('input[placeholder="Escreva a opção aqui"]')
  for (let k = 0; k < step.options.length; k++) {
    await click(inputs[k])
    await type(step.options[k], first ? 45 : 15)
  }
  if (first) await caption('Marque qual é a <b>opção correta</b>…')
  const radios = await page.$$('input[type="radio"][name^="correct-option"]')
  await click(radios[step.correct])
  if (first) await caption('…e clique em <b>Finalizar edição</b>. O editor grava tudo automaticamente.')
  await click(await byText('Finalizar edição', 'button'))
  await sleep(first ? 1500 : 600)
  SPEED = 650
}

const gameButton = text => page.waitForFunction(text =>
  [...document.querySelectorAll('button')].find(b => b.getClientRects().length && b.textContent.trim() === text),
{ timeout: 25000 }, text).then(h => h.asElement())

async function clickOption(text) {
  const h = await page.waitForFunction(t => [...document.querySelectorAll('.tl-opcao')]
    .find(b => b.getClientRects().length && b.textContent.trim().slice(1) === t), { timeout: 15000 }, text)
  await click(h.asElement())
}

async function answer(optionText) {
  const radio = await page.waitForFunction(t =>
    [...document.querySelectorAll('input[type="radio"]')].find(r => r.value === t && r.offsetParent), {}, optionText)
  await click(radio.asElement())
  await click(await gameButton('Enviar'))
}

// ------------------------------------------------------------------------------------
await page.goto(BASE, { waitUntil: 'networkidle0' })
await tl('card', `<img src="${LOGO}" alt=""><h1>Como criar um jogo no Tales Ludos</h1><p>Exemplo: “Noite estrelada de Van Gogh”</p>`, true)
await sleep(900)
let part = 1
let recorder = await page.screencast({ path: path.join(OUT, 'parte1.webm') })
async function nextPart() {
  await recorder.stop()
  part++
  recorder = await page.screencast({ path: path.join(OUT, `parte${part}.webm`) })
}
try {
  await sleep(4200)
  await card('')
  await sleep(700)

  // 1. Página inicial
  await caption('Acesse o Tales Ludos no navegador. <b>Não é preciso criar conta</b>: os jogos ficam salvos no seu computador.')
  const notice = await page.$('#sem-cadastro')
  await sleep(1200)
  await notice.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  await sleep(3300)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(1000)
  await caption('Para começar, clique em <b>TalesLudos online</b>.')
  await click(await byText('TalesLudos online', 'header a'))
  await page.waitForSelector('table')
  await sleep(500)

  // 2. Meus jogos
  await caption('Em <b>Meus jogos</b> ficam os jogos guardados neste navegador. Clique em <b>Novo jogo</b>.', 3200)
  await click(await byText('Novo jogo', 'main a'))
  await page.waitForSelector('#titulo')

  // 3. Dados do jogo
  await caption('Dê um <b>título</b> ao jogo…')
  await click('#titulo')
  await type(GAME.title, 45)
  await sleep(400)
  await caption('…escreva a <b>apresentação</b>, que o jogador lê ao começar…')
  await quill(0)
  await typeLong(GAME.intro1, 70)
  await page.keyboard.press('Enter')
  await caption('…e, se quiser, insira <b>imagens</b> no texto.')
  const imgButton = (await page.$$('.ql-toolbar .ql-image'))[0]
  const [chooser] = await Promise.all([page.waitForFileChooser(), click(imgButton)])
  await chooser.accept([path.join(ASSETS, 'van-gogh.jpg')])
  await sleep(1500)
  await page.keyboard.press('Enter')
  await type(GAME.intro2, 22)
  await sleep(800)

  await caption('Clique na imagem para <b>formatá-la</b>.')
  await click('.ql-editor img')
  await page.waitForSelector('.ql-media-overlay', { visible: true })
  await sleep(1200)
  await caption('Arraste a <b>alça</b> redonda para mudar o tamanho…')
  const handle = await centerOf('.ql-media-handle')
  const imgWidth = await page.$eval('.ql-editor img', e => e.getBoundingClientRect().width)
  await dragTo(handle.x, handle.y, handle.x - (imgWidth - 440), handle.y)
  await sleep(1000)
  await caption('…e use a barra de botões para <b>alinhar</b>: aqui, ao centro.')
  await click('.ql-media-toolbar [data-action="center"]')
  await sleep(1600)
  await caption('Também funciona com o dedo, no <b>celular</b>. O mesmo vale para os <b>vídeos</b>.', 3400)
  const lastP = await page.evaluateHandle(() => document.querySelector('.ql-editor').lastElementChild)
  await click(lastP.asElement())
  await sleep(600)

  await caption('Escolha a <b>imagem de fundo</b>, onde ficará o percurso: aqui, a própria pintura.')
  const file = await page.$('#imagem')
  await click(file)
  await file.uploadFile(path.join(ASSETS, 'noite-estrelada.jpg'))
  await page.waitForSelector('img[alt="Imagem de fundo"]', { visible: true })
  await centerOf('img[alt="Imagem de fundo"]')
  await sleep(1800)
  await caption('Por fim, a <b>área de conhecimento</b>, e <b>Gravar e editar o mapa</b>.')
  const area = await page.$('#area')
  await click(area)
  await area.select('9') // Letras e Artes
  await sleep(800)
  await click(await byText('Gravar e editar o mapa'))
  await page.waitForSelector('.map-canvas canvas')
  await sleep(1200)

  // 4. Marcas
  await caption('Agora, <b>clique na imagem</b> para marcar os locais do percurso, na ordem em que o jogador vai passar.')
  let box = await scrollToCanvas()
  await sleep(1200)
  for (const m of GAME.marks) {
    await clickAt(...markPoint(box, m))
    await sleep(600)
  }
  await caption('As marcas com <b>borda vermelha</b> ainda não têm cena nem desafio.', 2600)

  // 5. Cenas e desafios
  await caption('No modo <b>editar</b>, clique em uma marca para criar a cena e o desafio.')
  await click('label[for="mode-edit"]')
  await fillStep(0, { first: true })
  await caption('Faça o mesmo em cada local do percurso… <b>(acelerado)</b>')
  await sleep(1500)
  await nextPart()
  for (let i = 1; i < GAME.steps.length; i++) {
    await fillStep(i, { first: false })
  }
  await nextPart()
  await scrollToCanvas()
  await caption('Pronto: quatro locais, cada um com cena e desafio. Há também verdadeiro ou falso, lacuna, associação e resposta curta.', 4500)

  // 6. Visualizar e jogar (motor com trilha)
  await caption('Clique em <b>Visualizar</b> para jogar e testar o jogo.')
  const urlEditor = page.url()
  await click(await byText('Visualizar', 'button'))
  await page.waitForFunction(() => location.pathname.endsWith('preview.html') && document.body)
  await page.evaluate(() => { window.__tl.init(); window.__tl.gameMode() })
  await gameButton('Começar a trilha')
  await caption('O jogo começa pela <b>apresentação</b>, com as regras.', 3600)
  await click(await gameButton('Começar a trilha'))
  await sleep(600)
  await caption('Os locais viram uma <b>trilha</b> sobre a imagem. O jogador toca no local destacado.', 3600)
  await click('.tl-no.tl-atual')
  await caption('Primeiro, ele lê a <b>cena</b>…', 3200)
  await click(await gameButton('Continuar'))
  await caption('…depois responde ao <b>desafio</b> e clica em <b>Verificar</b>.')
  await sleep(1200)
  await clickOption(GAME.steps[0].options[GAME.steps[0].correct])
  await click(await gameButton('Verificar'))
  await caption('Acertou!', 1800)
  await click(await gameButton('Continuar'))
  await caption('O personagem <b>caminha</b> e o próximo local é liberado.', 3000)

  await click('.tl-no.tl-atual')
  await caption('')
  await click(await gameButton('Continuar'))
  await clickOption(GAME.steps[1].options[GAME.steps[1].correct])
  await click(await gameButton('Verificar'))
  await sleep(700)
  await click(await gameButton('Continuar'))
  await sleep(2600)

  await click('.tl-no.tl-atual')
  await click(await gameButton('Continuar'))
  await caption('E se o jogador <b>errar</b>?')
  await clickOption(GAME.steps[2].options[0]) // resposta errada, de propósito
  await click(await gameButton('Verificar'))
  await caption('Perde uma <b>vida</b> ❤ e pode rever a cena ou tentar de novo.', 4200)
  await click(await gameButton('Tentar de novo'))
  await caption('')
  await clickOption(GAME.steps[2].options[GAME.steps[2].correct])
  await click(await gameButton('Verificar'))
  await sleep(700)
  await click(await gameButton('Continuar'))
  await sleep(2600)

  await click('.tl-no.tl-atual')
  await click(await gameButton('Continuar'))
  await clickOption(GAME.steps[3].options[GAME.steps[3].correct])
  await click(await gameButton('Verificar'))
  await sleep(700)
  await click(await gameButton('Continuar'))
  await gameButton('Jogar de novo')
  await caption('No fim, a <b>nota</b>. No Moodle, ela vai direto para o livro de notas.', 5000)

  // 7. Salvar e exportar
  await caption('')
  await page.evaluate(() => document.documentElement.classList.remove('tl-game'))
  await page.goto(urlEditor, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.map-canvas canvas')
  await page.evaluate(() => window.__tl.init())
  await sleep(500)
  const exportBtn = await byText('Exportar jogo', 'button')
  await centerOf(exportBtn)
  await caption('<b>Salvar projeto em arquivo</b> (.tlud) guarda uma cópia para continuar a edição em outro computador.')
  await click(await byText('Salvar projeto em arquivo', 'button'))
  await sleep(2800)
  await caption('<b>Exportar jogo (.zip)</b> gera o jogo pronto: publique em qualquer site ou envie ao <b>Moodle</b> como pacote SCORM.')
  await click(exportBtn)
  await sleep(4800)
  await caption('')
  await card(`<img src="${LOGO}" alt=""><h1>Agora é a sua vez!</h1><p>Crie o seu jogo educacional, sem cadastro e direto no navegador.</p><div class="url">luizedsilva.github.io/talesludos-react</div>`, 5500)
} finally {
  await recorder.stop()
  await browser.close()
}

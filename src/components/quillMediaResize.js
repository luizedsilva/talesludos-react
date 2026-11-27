// Módulo do Quill para formatar imagens e vídeos dentro do editor,
// tanto com o mouse quanto com o dedo (celular e tablet).
//
// Ao tocar ou clicar numa imagem ou num vídeo, aparece uma moldura com uma
// alça para arrastar (muda a largura) e uma barra com botões grandes:
// alinhar à esquerda, ao centro ou à direita, diminuir, aumentar, ocupar a
// largura toda e apagar.
//
// Usa Pointer Events, que tratam mouse, toque e caneta do mesmo jeito; o
// módulo antigo (quill-image-resize-vue) só ouvia eventos de mouse, por isso
// não funcionava no celular, e também não tratava vídeos.
//
// A largura fica no atributo width (que o Quill guarda no HTML) e o
// alinhamento no style do elemento, como o módulo antigo fazia, para que o
// conteúdo já criado continue igual.

const MIN_WIDTH = 40
const STEP = 0.15 // diminuir/aumentar muda 15% da largura atual

const ICONS = {
  left:
    '<svg viewBox="0 0 18 18"><line x1="3" x2="15" y1="9" y2="9"/><line x1="3" x2="13" y1="14" y2="14"/><line x1="3" x2="9" y1="4" y2="4"/></svg>',
  center:
    '<svg viewBox="0 0 18 18"><line x1="15" x2="3" y1="9" y2="9"/><line x1="14" x2="4" y1="14" y2="14"/><line x1="12" x2="6" y1="4" y2="4"/></svg>',
  right:
    '<svg viewBox="0 0 18 18"><line x1="15" x2="3" y1="9" y2="9"/><line x1="15" x2="5" y1="14" y2="14"/><line x1="15" x2="9" y1="4" y2="4"/></svg>',
  smaller: '<svg viewBox="0 0 18 18"><line x1="4" x2="14" y1="9" y2="9"/></svg>',
  bigger:
    '<svg viewBox="0 0 18 18"><line x1="4" x2="14" y1="9" y2="9"/><line x1="9" x2="9" y1="4" y2="14"/></svg>',
  full:
    '<svg viewBox="0 0 18 18"><polyline points="6 5 2 9 6 13"/><polyline points="12 5 16 9 12 13"/><line x1="2" x2="16" y1="9" y2="9"/></svg>',
  remove:
    '<svg viewBox="0 0 18 18"><line x1="4" x2="14" y1="5" y2="5"/><path d="M6 5V3.5h6V5M5.5 5l.7 10h5.6l.7-10"/></svg>'
}

export default class MediaResize {
  constructor(quill, options = {}) {
    this.quill = quill
    this.onChange = options.onChange || (() => {})
    this.media = null
    this.overlay = null

    // O Firefox tem alças próprias de redimensionar; desliga para não confundir.
    try {
      document.execCommand('enableObjectResizing', false, 'false')
    } catch {
      /* navegador sem suporte */
    }

    this.container = quill.root.parentNode // .ql-container
    if (!this.container.style.position) this.container.style.position = 'relative'

    quill.root.addEventListener('click', this.handleClick)
    quill.root.addEventListener('scroll', this.reposition)
    quill.on('text-change', this.handleTextChange)
    document.addEventListener('pointerdown', this.handleOutside, true)
    document.addEventListener('keydown', this.handleKey, true)
    window.addEventListener('resize', this.reposition)
  }

  destroy() {
    this.hide()
    this.quill.root.removeEventListener('click', this.handleClick)
    this.quill.root.removeEventListener('scroll', this.reposition)
    this.quill.off('text-change', this.handleTextChange)
    document.removeEventListener('pointerdown', this.handleOutside, true)
    document.removeEventListener('keydown', this.handleKey, true)
    window.removeEventListener('resize', this.reposition)
  }

  // Os iframes de vídeo ficam com pointer-events: none no editor (senão o
  // toque vai para dentro do player); por isso procura pela posição do toque.
  findMediaAt = (x, y) => {
    const items = this.quill.root.querySelectorAll('img, iframe.ql-video, video')
    for (const el of items) {
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el
    }
    return null
  }

  handleClick = evt => {
    const el = this.findMediaAt(evt.clientX, evt.clientY)
    if (el) {
      evt.preventDefault()
      this.show(el)
    } else if (this.media) {
      this.hide()
    }
  }

  handleOutside = evt => {
    if (!this.media) return
    if (this.overlay && this.overlay.contains(evt.target)) return
    if (this.quill.root.contains(evt.target)) return // tratado em handleClick
    this.hide()
  }

  handleKey = evt => {
    if (!this.media) return
    if (evt.key === 'Delete' || evt.key === 'Backspace') {
      evt.preventDefault()
      evt.stopPropagation()
      this.remove()
    } else if (evt.key === 'Escape') {
      this.hide()
    }
  }

  handleTextChange = () => {
    if (this.media && !this.quill.root.contains(this.media)) this.hide()
    else this.reposition()
  }

  show(el) {
    if (this.media === el) return
    this.hide()
    this.media = el
    // Tira o cursor do texto: no celular isso evita abrir o teclado.
    this.quill.blur()
    window.getSelection()?.removeAllRanges()
    this.buildOverlay()
    this.reposition()
  }

  hide = () => {
    if (this.overlay) this.overlay.remove()
    this.overlay = null
    this.media = null
  }

  buildOverlay() {
    const overlay = document.createElement('div')
    overlay.className = 'ql-media-overlay'

    const handle = document.createElement('div')
    handle.className = 'ql-media-handle'
    handle.title = 'Arraste para mudar o tamanho'
    handle.addEventListener('pointerdown', this.startDrag)
    overlay.appendChild(handle)

    this.sizeLabel = document.createElement('div')
    this.sizeLabel.className = 'ql-media-size'
    overlay.appendChild(this.sizeLabel)

    const bar = document.createElement('div')
    bar.className = 'ql-media-toolbar'
    const buttons = [
      ['left', 'Alinhar à esquerda', () => this.align('left')],
      ['center', 'Centralizar', () => this.align('center')],
      ['right', 'Alinhar à direita', () => this.align('right')],
      ['smaller', 'Diminuir', () => this.scale(1 - STEP)],
      ['bigger', 'Aumentar', () => this.scale(1 + STEP)],
      ['full', 'Largura total', () => this.setWidth(this.maxWidth())],
      ['remove', 'Apagar', () => this.remove()]
    ]
    for (const [icon, label, action] of buttons) {
      const b = document.createElement('button')
      b.type = 'button'
      b.title = label
      b.setAttribute('aria-label', label)
      b.innerHTML = ICONS[icon]
      b.dataset.action = icon
      // Não deixa o botão roubar o foco (no celular abriria o teclado).
      b.addEventListener('pointerdown', e => e.preventDefault())
      b.addEventListener('click', e => {
        e.preventDefault()
        action()
      })
      bar.appendChild(b)
    }
    overlay.appendChild(bar)
    this.toolbar = bar

    this.container.appendChild(overlay)
    this.overlay = overlay
  }

  reposition = () => {
    if (!this.overlay || !this.media) return
    const r = this.media.getBoundingClientRect()
    const c = this.container.getBoundingClientRect()
    Object.assign(this.overlay.style, {
      left: `${r.left - c.left + this.container.scrollLeft}px`,
      top: `${r.top - c.top + this.container.scrollTop}px`,
      width: `${r.width}px`,
      height: `${r.height}px`
    })
    this.sizeLabel.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`
    const current = this.currentAlign()
    this.overlay.classList.toggle('is-right', current === 'right')
    this.placeToolbar(r.left - c.left, r.width)
    this.overlay.querySelectorAll('[data-action]').forEach(b => {
      b.classList.toggle('active', b.dataset.action === current)
    })
  }

  // Centraliza a barra sob a mídia, sem deixar que ela saia do editor
  // (numa tela estreita, uma imagem pequena perto da borda empurraria a barra
  // para fora).
  placeToolbar(mediaLeft, mediaWidth) {
    const bar = this.toolbar
    const avail = this.container.clientWidth
    bar.style.maxWidth = `${avail}px`
    const w = bar.offsetWidth
    let left = mediaLeft + (mediaWidth - w) / 2
    left = Math.max(0, Math.min(left, avail - w))
    bar.style.left = `${left - mediaLeft}px`
  }

  maxWidth() {
    const root = this.quill.root
    const cs = getComputedStyle(root)
    return Math.floor(root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
  }

  setWidth(width) {
    const el = this.media
    if (!el) return
    const w = Math.round(Math.max(MIN_WIDTH, Math.min(width, this.maxWidth())))
    if (el.tagName === 'IMG') {
      el.setAttribute('width', w)
      el.removeAttribute('height')
    } else {
      // Vídeo: mantém a proporção (16:9 se ainda não tiver tamanho; o
      // tamanho padrão do iframe, 300×150, não é a proporção do vídeo).
      const r = el.getBoundingClientRect()
      const ratio = el.hasAttribute('height') && r.width ? r.height / r.width : 9 / 16
      el.setAttribute('width', w)
      el.setAttribute('height', Math.round(w * ratio))
    }
    this.changed()
  }

  scale(factor) {
    if (!this.media) return
    this.setWidth(this.media.getBoundingClientRect().width * factor)
  }

  currentAlign() {
    const s = this.media?.style
    if (!s) return null
    if (s.float === 'left') return 'left'
    if (s.float === 'right') return 'right'
    if (s.marginLeft === 'auto' && s.marginRight === 'auto') return 'center'
    return null
  }

  align(where) {
    const s = this.media?.style
    if (!s) return
    if (this.currentAlign() === where) {
      // Tocar de novo no alinhamento ativo desfaz o alinhamento.
      s.removeProperty('float')
      s.removeProperty('margin')
      s.removeProperty('display')
    } else if (where === 'center') {
      s.removeProperty('float')
      s.display = 'block'
      s.margin = '0 auto'
    } else {
      s.display = 'inline'
      s.float = where
      s.margin = where === 'left' ? '0 1em 1em 0' : '0 0 1em 1em'
    }
    if (!this.media.getAttribute('style')) this.media.removeAttribute('style')
    this.changed()
  }

  remove() {
    const el = this.media
    if (!el) return
    this.hide()
    const blot = window.Quill.find(el)
    if (blot) {
      this.quill.deleteText(this.quill.getIndex(blot), 1, 'user')
    } else {
      el.remove()
      this.onChange()
    }
  }

  startDrag = evt => {
    if (!this.media) return
    evt.preventDefault()
    evt.stopPropagation()
    const handle = evt.currentTarget
    handle.setPointerCapture(evt.pointerId)
    const startX = evt.clientX
    const startWidth = this.media.getBoundingClientRect().width
    // Com a mídia alinhada à direita, a alça fica do lado de dentro; arrastar
    // para a esquerda aumenta.
    const sign = this.currentAlign() === 'right' ? -1 : 1

    const move = e => {
      this.setWidth(startWidth + sign * (e.clientX - startX))
    }
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  // Mudar só o style não gera text-change no Quill, então avisa direto.
  changed() {
    this.quill.update('user')
    this.reposition()
    this.onChange()
  }
}

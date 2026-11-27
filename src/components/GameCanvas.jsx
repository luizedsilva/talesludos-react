// Mapa do jogo desenhado com p5.js (modo instância).
// As coordenadas das marcas são frações (0..1) da largura e da altura do mapa,
// na mesma proporção usada pelo motor do jogo (MAP_ASPECT).
import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { MAP_ASPECT } from '../storage/gameModel'

const DIAMETER = 40
const DRAG_THRESHOLD = 4 // px: abaixo disso é clique, acima é arrastar
// O p5 trata o valor como um único nome de família; a Inter é carregada pelo index.html.
const FONTE = 'Inter'

// Cores da marca (as mesmas da trilha no jogo, public/game/css/jogo.css).
const COR = {
  roxo: [90, 58, 186],
  roxoProfundo: [44, 29, 99],
  laranja: [229, 113, 69],
  laranjaEscuro: [196, 83, 42],
  cinza: [227, 227, 227],
  cinzaEscuro: [185, 185, 185],
  textoSuave: [93, 88, 115],
  vermelho: [220, 53, 69],
  contorno: [44, 29, 99, 140]
}

// mode: 'add' | 'edit' | 'move'
export default function GameCanvas({ imageUrl, marks, missing, mode, selected, onAdd, onSelect, onMove }) {
  const hostRef = useRef(null)
  // As funções do p5 leem sempre as props mais recentes por esta referência.
  const props = useRef({})
  props.current = { marks, missing, mode, selected, onAdd, onSelect, onMove }

  useEffect(() => {
    const host = hostRef.current
    let w = host.clientWidth
    let h = w / MAP_ASPECT
    let back = null
    let drag = null // { index, startX, startY, x, y, moved }
    // Uma instância removida antes de terminar o preload ainda chega a rodar
    // (acontece com o StrictMode do React); ela deve ignorar os eventos.
    let disposed = false

    const markAt = (sk, x, y) => {
      const coords = props.current.marks
      for (let i = coords.length - 1; i >= 0; i--) {
        if (sk.dist(coords[i].x * w, coords[i].y * h, x, y) <= DIAMETER / 2) return i
      }
      return -1
    }
    const inside = (x, y) => x >= 0 && y >= 0 && x <= w && y <= h
    const clampFrac = (v, size) => Math.min(Math.max(v / size, 0.02), 0.98)

    const sketch = sk => {
      sk.preload = () => {
        back = sk.loadImage(imageUrl)
      }

      sk.setup = () => {
        sk.createCanvas(w, h)
        sk.textAlign(sk.CENTER, sk.CENTER)
      }

      sk.draw = () => {
        const { marks: coords, missing: miss, selected: sel } = props.current
        sk.background(220)
        if (back) sk.image(back, 0, 0, w, h)

        const pos = i =>
          drag && drag.index === i && drag.moved ? { x: drag.x, y: drag.y } : { x: coords[i].x * w, y: coords[i].y * h }

        // Trilha: mesmo desenho do jogo exportado (contorno escuro + pontilhado branco).
        const ctx = sk.drawingContext
        sk.strokeCap(sk.ROUND)
        for (let i = 0; i < coords.length - 1; i++) {
          const a = pos(i)
          const b = pos(i + 1)
          sk.stroke(...COR.contorno)
          sk.strokeWeight(10)
          sk.line(a.x, a.y, b.x, b.y)
          ctx.setLineDash([2, 12])
          sk.stroke(255)
          sk.strokeWeight(5)
          sk.line(a.x, a.y, b.x, b.y)
          ctx.setLineDash([])
        }

        // Nós da trilha
        sk.textFont(FONTE)
        sk.textStyle(sk.BOLD)
        for (let i = 0; i < coords.length; i++) {
          const p = pos(i)
          const selecionado = i === sel
          const incompleto = miss.includes(i)
          const corpo = selecionado ? COR.laranja : incompleto ? COR.cinza : COR.roxo
          const sombra = selecionado ? COR.laranjaEscuro : incompleto ? COR.cinzaEscuro : COR.roxoProfundo

          if (selecionado) {
            // anel pulsando, como o local atual no jogo
            const t = (sk.frameCount % 60) / 60
            sk.noFill()
            sk.stroke(...COR.laranja, 255 * (1 - t))
            sk.strokeWeight(3)
            sk.ellipse(p.x, p.y, DIAMETER + 8 + t * 16)
          }
          sk.noStroke()
          sk.fill(...sombra)
          sk.ellipse(p.x, p.y + 4, DIAMETER) // "degrau" inferior do botão
          sk.stroke(...(incompleto ? COR.vermelho : [255, 255, 255]))
          sk.strokeWeight(incompleto ? 4 : 3.5)
          sk.fill(...corpo)
          sk.ellipse(p.x, p.y, DIAMETER)
          sk.noStroke()
          sk.fill(...(selecionado ? COR.roxoProfundo : incompleto ? COR.textoSuave : [255, 255, 255]))
          sk.textSize(16)
          sk.text(String(i + 1), p.x, p.y + 1)
        }

        // Rótulos de início e fim da trilha
        if (coords.length > 0) rotulo(sk, pos(0), 'Início', COR.laranjaEscuro)
        if (coords.length > 1) rotulo(sk, pos(coords.length - 1), 'Fim', COR.roxo)
      }

      // Balão com texto acima do nó (abaixo, se o nó estiver perto do topo).
      const rotulo = (sk, p, texto, cor) => {
        sk.textSize(11)
        const largura = sk.textWidth(texto.toUpperCase()) + 16
        const altura = 20
        const acima = p.y - DIAMETER / 2 - altura - 6 > 0
        const y = acima ? p.y - DIAMETER / 2 - altura / 2 - 8 : p.y + DIAMETER / 2 + altura / 2 + 10
        sk.stroke(...COR.cinza)
        sk.strokeWeight(2)
        sk.fill(255)
        sk.rect(p.x - largura / 2, y - altura / 2, largura, altura, 8)
        sk.noStroke()
        sk.fill(...cor)
        sk.text(texto.toUpperCase(), p.x, y + 1)
      }

      sk.mousePressed = event => {
        // só cliques/toques no próprio canvas (o p5 escuta a janela inteira)
        if (disposed || !event || event.target !== sk.canvas) return
        const x = sk.mouseX
        const y = sk.mouseY
        if (!inside(x, y)) return
        const { mode: m, selected: sel } = props.current
        const index = markAt(sk, x, y)

        if (m === 'move') {
          // toque na marca e depois no destino
          if (index !== -1) props.current.onSelect(index === sel ? -1 : index)
          else if (sel !== -1) {
            props.current.onMove(sel, clampFrac(x, w), clampFrac(y, h))
            props.current.onSelect(-1)
          }
          return false
        }

        if (index !== -1) {
          drag = { index, startX: x, startY: y, x, y, moved: false }
        } else if (m === 'add') {
          props.current.onAdd(clampFrac(x, w), clampFrac(y, h))
        } else if (m === 'edit') {
          props.current.onSelect(-1)
        }
        return false
      }

      sk.mouseDragged = () => {
        if (disposed || !drag) return
        drag.x = Math.min(Math.max(sk.mouseX, 0), w)
        drag.y = Math.min(Math.max(sk.mouseY, 0), h)
        if (sk.dist(drag.x, drag.y, drag.startX, drag.startY) > DRAG_THRESHOLD) drag.moved = true
        return false
      }

      sk.mouseReleased = () => {
        if (disposed || !drag) return
        const d = drag
        drag = null
        if (d.moved) {
          props.current.onMove(d.index, clampFrac(d.x, w), clampFrac(d.y, h))
        } else if (props.current.mode === 'edit') {
          props.current.onSelect(d.index === props.current.selected ? -1 : d.index)
        }
      }
    }

    const instance = new p5(sketch, host)

    const resize = new ResizeObserver(() => {
      const nw = host.clientWidth
      if (!nw || nw === w) return
      w = nw
      h = w / MAP_ASPECT
      instance.resizeCanvas(w, h)
    })
    resize.observe(host)

    return () => {
      disposed = true
      resize.disconnect()
      instance.remove()
    }
  }, [imageUrl])

  return <div ref={hostRef} className="map-canvas my-2" />
}

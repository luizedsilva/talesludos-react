// Mapa do jogo desenhado com p5.js (modo instância).
// As coordenadas das marcas são frações (0..1) da largura e da altura do mapa,
// na mesma proporção usada pelo motor do jogo (MAP_ASPECT).
import { useEffect, useRef } from 'react'
import p5 from 'p5'
import { MAP_ASPECT } from '../storage/gameModel'

const DIAMETER = 40
const DRAG_THRESHOLD = 4 // px: abaixo disso é clique, acima é arrastar

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

        // percurso
        sk.stroke(255, 255, 255, 220)
        sk.strokeWeight(4)
        for (let i = 0; i < coords.length - 1; i++) {
          const a = pos(i)
          const b = pos(i + 1)
          sk.line(a.x, a.y, b.x, b.y)
        }

        // marcas
        for (let i = 0; i < coords.length; i++) {
          const p = pos(i)
          sk.strokeWeight(3)
          sk.stroke(miss.includes(i) ? sk.color(220, 53, 69) : 255)
          if (i === sel) sk.fill(229, 113, 69) // laranja da marca: marca selecionada
          else sk.fill(90, 58, 186) // roxo da marca
          sk.ellipse(p.x, p.y, DIAMETER)
          sk.noStroke()
          sk.fill(255)
          sk.textSize(16)
          sk.text(String(i + 1), p.x, p.y)
        }
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

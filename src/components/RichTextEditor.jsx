// Editor de texto rico (Quill 1.x, o mesmo usado na versão Vue, para que o
// HTML gerado continue igual ao que o motor do jogo espera).
// Imagens podem ser arrastadas para o editor e ficam embutidas no HTML como
// data: URL. Imagens e vídeos podem ser redimensionados e alinhados com o
// mouse ou com o dedo (ver quillMediaResize.js).
import { useEffect, useRef } from 'react'
import Quill from './quillSetup'
import { ImageDrop } from 'quill-image-drop-module'
import MediaResize from './quillMediaResize'
import 'quill/dist/quill.snow.css'

Quill.register('modules/imageDrop', ImageDrop, true)
Quill.register('modules/mediaResize', MediaResize, true)

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote', 'link', 'image', 'video'],
  ['clean']
]

export default function RichTextEditor({ value, onChange, placeholder }) {
  const hostRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Cria o Quill uma vez.
  useEffect(() => {
    const host = hostRef.current
    const el = document.createElement('div')
    host.appendChild(el)
    let quill = null
    const emit = () => {
      if (!quill) return
      const html = quill.root.innerHTML
      onChangeRef.current(html === '<p><br></p>' ? '' : html)
    }
    quill = new Quill(el, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: TOOLBAR, imageDrop: true, mediaResize: { onChange: emit } }
    })
    quill.root.innerHTML = value || ''
    quill.on('text-change', emit)
    quillRef.current = quill
    return () => {
      quill.getModule('mediaResize').destroy()
      quillRef.current = null
      host.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza o conteúdo quando ele muda por fora (ex.: outra marca selecionada).
  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    const current = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML
    if ((value || '') !== current) quill.root.innerHTML = value || ''
  }, [value])

  return <div className="rich-editor" ref={hostRef} />
}

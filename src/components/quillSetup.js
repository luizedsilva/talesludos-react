// Módulos do Quill como o quill-image-drop-module procuram o Quill em
// window.Quill, por isso este arquivo precisa ser importado antes deles.
import Quill from 'quill'

window.Quill = Quill

export default Quill

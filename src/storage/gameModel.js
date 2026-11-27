// Regras do roteiro do jogo (marcas, cenas e desafios).
//
// O motor do jogo (public/game/js) espera:
//  - marks.coords em ordem de percurso, com id = posição + 1;
//  - links sequenciais: links[k] liga a marca k à marca k+1;
//  - scenes e challenges ligados à marca pelo mesmo id.
// Todas as funções devolvem um novo objeto "game" (não alteram o original).

export const MAP_ASPECT = 700 / 500 // área do mapa no motor do jogo (largura / altura)

export const CHALLENGE_TYPES = [
  { value: 1, label: 'Verdadeiro ou falso' },
  { value: 2, label: 'Múltipla escolha' },
  { value: 3, label: 'Preenchimento de lacuna' },
  { value: 4, label: 'Associação' },
  { value: 5, label: 'Resposta curta' }
]

export function challengeTypeLabel(type) {
  const t = CHALLENGE_TYPES.find(c => c.value === Number(type))
  return t ? t.label : ''
}

export function emptyChallenge(id) {
  return {
    id,
    type: 0,
    content: '',
    correct: false,
    options: [{ text: '' }, { text: '' }],
    correctOptionIndex: -1,
    answer: '',
    associations: [{ text: '', associated: '' }]
  }
}

function sequentialLinks(count) {
  const links = []
  for (let i = 0; i < count - 1; i++) links.push({ i, j: i + 1, removed: false })
  return links
}

// Corrige dados antigos: ids fora de ordem, links removidos, cenas órfãs.
export function normalizeGame(game) {
  const coords = game.marks.coords
  const idMap = new Map(coords.map((m, i) => [m.id, i + 1]))
  const remap = list =>
    (list || [])
      .filter(item => idMap.has(item.id))
      .map(item => ({ ...item, id: idMap.get(item.id) }))
  return {
    ...game,
    marks: { coords: coords.map((m, i) => ({ ...m, id: i + 1 })), nextMark: coords.length + 1 },
    links: sequentialLinks(coords.length),
    scenes: remap(game.scenes),
    challenges: remap(game.challenges)
  }
}

export function addMark(game, x, y) {
  const coords = [...game.marks.coords, { id: game.marks.coords.length + 1, x, y }]
  return { ...game, marks: { coords, nextMark: coords.length + 1 }, links: sequentialLinks(coords.length) }
}

export function moveMark(game, index, x, y) {
  const coords = game.marks.coords.map((m, i) => (i === index ? { ...m, x, y } : m))
  return { ...game, marks: { ...game.marks, coords } }
}

export function deleteMark(game, index) {
  const removedId = index + 1
  const shift = item => (item.id > removedId ? { ...item, id: item.id - 1 } : item)
  const coords = game.marks.coords.filter((_, i) => i !== index).map((m, i) => ({ ...m, id: i + 1 }))
  return {
    ...game,
    marks: { coords, nextMark: coords.length + 1 },
    links: sequentialLinks(coords.length),
    scenes: game.scenes.filter(s => s.id !== removedId).map(shift),
    challenges: game.challenges.filter(c => c.id !== removedId).map(shift)
  }
}

// Troca a cena e o desafio de duas posições do percurso (as marcas ficam no lugar).
export function swapSteps(game, a, b) {
  const idA = a + 1
  const idB = b + 1
  const swap = item =>
    item.id === idA ? { ...item, id: idB } : item.id === idB ? { ...item, id: idA } : item
  const byId = (x, y) => x.id - y.id
  return {
    ...game,
    scenes: game.scenes.map(swap).sort(byId),
    challenges: game.challenges.map(swap).sort(byId)
  }
}

export function getStep(game, index) {
  const id = index + 1
  const scene = game.scenes.find(s => s.id === id)
  const challenge = game.challenges.find(c => c.id === id)
  return {
    scene: scene ? scene.content : '',
    challenge: challenge ? { ...emptyChallenge(id), ...challenge } : emptyChallenge(id)
  }
}

export function setStep(game, index, sceneContent, challenge) {
  const id = index + 1
  const upsert = (list, item) => {
    const others = list.filter(x => x.id !== id)
    return [...others, item].sort((x, y) => x.id - y.id)
  }
  return {
    ...game,
    scenes: upsert(game.scenes, { id, content: sceneContent }),
    challenges: upsert(game.challenges, { ...challenge, id, type: Number(challenge.type) })
  }
}

export function hasStep(game, index) {
  return game.challenges.some(c => c.id === index + 1)
}

// Posições (base 0) das marcas sem desafio.
export function missingSteps(game) {
  return game.marks.coords.map((_, i) => i).filter(i => !hasStep(game, i))
}

const isBlank = html => !html || !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() && !/<img/i.test(html)

// Lista de problemas que impedem finalizar a edição de uma etapa.
export function validateStep(sceneContent, challenge) {
  const errors = []
  if (isBlank(sceneContent)) errors.push('a cena não pode estar vazia')
  if (isBlank(challenge.content)) errors.push('o desafio não pode estar vazio')
  const type = Number(challenge.type)
  if (!type) {
    errors.push('o tipo de desafio não foi selecionado')
  } else if (type === 2) {
    if (challenge.options.length < 2) errors.push('é necessário ao menos duas opções')
    if (challenge.options.some(o => !o.text.trim())) errors.push('todas as opções devem ser preenchidas')
    if (challenge.correctOptionIndex < 0 || challenge.correctOptionIndex >= challenge.options.length) {
      errors.push('a opção correta não foi selecionada')
    }
  } else if (type === 3) {
    if ((challenge.content.match(/\$[^$]+\$/g) || []).length === 0) {
      errors.push('coloque ao menos uma palavra entre cifrões ($) para indicar a lacuna')
    }
  } else if (type === 4) {
    if (challenge.associations.length === 0) errors.push('é necessário ao menos uma associação')
    if (challenge.associations.some(a => !a.text.trim() || !a.associated.trim())) {
      errors.push('todas as associações devem ser preenchidas')
    }
  } else if (type === 5) {
    if (!challenge.answer.trim()) errors.push('a resposta não pode estar vazia')
  }
  return errors
}

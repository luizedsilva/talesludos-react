# Tales Ludos (React)

Ferramenta de autoria de jogos educacionais baseados em um mapa: o autor escolhe uma imagem de fundo, marca locais
nela e define, para cada local, uma cena (conteúdo) e um desafio. O jogo gerado é um site estático em p5.js que
também pode ser importado no Moodle como pacote SCORM 1.2.

Esta versão roda **inteiramente no navegador**, sem backend, banco de dados ou cadastro, no mesmo modelo do
eXeLearning online.

**Acesse:** https://luizedsilva.github.io/talesludos-react/

## Página inicial

A página inicial (`/`) apresenta a ferramenta, no estilo do site do eXeLearning, e tem layout próprio, sem o
cabeçalho do editor. O editor é aberto pelo botão **TalesLudos online**, que leva a **Meus jogos** (`/jogos`).

A página traz:

- **Destaque** com os botões **TalesLudos online** e **Exemplo de jogo**;
- **Não é preciso criar conta**: explica que os jogos são salvos localmente, no navegador, sem envio a servidor, e
  recomenda salvar o `.tlud` como cópia de segurança;
- **Como funciona** (cenário → locais → cenas e desafios → exportação) e **Por que usar**;
- vídeo de apresentação, **Histórico** das versões, **Apoio** (CAPES, UNIFAL-MG) e **Desenvolvido com** (React, p5.js).

## Como usar

- **Meus jogos**: os projetos ficam guardados no navegador (IndexedDB). O editor do mapa grava automaticamente.
- **Salvar projeto em arquivo**: baixa um `.tlud` (zip com `project.json` e a imagem de fundo). Use como cópia de
  segurança ou para continuar em outro computador, com **Abrir projeto**.
- **Visualizar**: abre o jogo em uma nova aba (`public/game/preview.html`, que lê o projeto do IndexedDB).
- **Exportar jogo (.zip)**: baixa o jogo pronto (`index.html`, motor do jogo, `config/game.js` e `imsmanifest.xml`).
  Descompacte e abra o `index.html`, publique em qualquer servidor estático ou envie ao Moodle como SCORM.

> Os projetos guardados no navegador são apagados se os dados do site forem limpos. Salve o `.tlud` regularmente.

## Desenvolvimento

Requer Node.js 18 ou superior (o deploy usa Node.js 22).

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # gera dist/ (site estático)
npm run preview  # serve o dist/ localmente
```

O resultado de `npm run build` é um site estático. Como o app usa rotas do navegador (`/jogos/...`), o servidor deve
devolver `index.html` para caminhos desconhecidos.

### GitHub Pages

O workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) publica o site a cada push na `main`
(ou manualmente em *Actions*). No repositório, em **Settings → Pages**, escolha **Source: GitHub Actions**.
O subcaminho (`/<repositório>/`) é definido por `BASE_PATH` no build, e o `404.html` (cópia do `index.html`)
faz as rotas `/jogos/...` funcionarem ao recarregar a página.

## Estrutura

```
public/game/          motor do jogo (p5.js) copiado para cada jogo exportado; preview.html para visualizar
public/images/        imagens da interface
src/storage/          dados, sem dependência de React:
  db.js               IndexedDB (área de trabalho)
  project.js          modelo do projeto, áreas de conhecimento
  gameModel.js        regras do roteiro (marcas, cenas, desafios, validação)
  files.js            arquivo .tlud, pacote .zip do jogo, imsmanifest.xml
  actions.js          salvar arquivo, exportar, visualizar
src/components/       cabeçalho do editor, canvas do mapa (p5), editor de texto (Quill), editor de cena e desafio
src/pages/            telas: página inicial (Home.jsx), lista, dados do jogo, detalhes, editor do mapa
src/styles.css        estilos do editor e da página inicial (classes .landing-*)
```

### Formato do jogo

O motor do jogo (`public/game/js`) espera, em `config/game.js`, um objeto `game` com `title`, `introduce`,
`marks.coords` (frações 0..1 da área do mapa, que tem proporção 700×500), `links` sequenciais (marca k → k+1) e
`scenes`/`challenges` ligados à marca pelo `id`. Tipos de desafio: 1 verdadeiro ou falso, 2 múltipla escolha,
3 preenchimento de lacuna (palavras entre `$`), 4 associação, 5 resposta curta.

Os arquivos `.tlud` são compatíveis com os da versão Vue com armazenamento local.

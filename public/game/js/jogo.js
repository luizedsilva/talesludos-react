// Tales Ludos: motor do jogo.
// Os locais marcados pelo autor na imagem viram uma trilha: cada local tem uma cena (conteúdo)
// e um desafio; ao acertar, o próximo local é liberado. O jogador tem vidas: cada erro custa uma.
//
// Entrada: variável global "game" (config/game.js), no mesmo formato das versões anteriores:
//   { title, introduce, marks: { coords: [{ id, x, y }] }, links, scenes: [{ id, content }],
//     challenges: [{ id, type, content, correct, options, correctOptionIndex, answer, associations }] }
// e a imagem do mapa em <img id="mapa">.
(function () {
  'use strict';

  var VIDAS = 3;

  // ---------------------------------------------------------------------------------------
  // Ícones (SVG em linha)
  // ---------------------------------------------------------------------------------------
  var ICONE = {
    coracao: '<svg class="tl-coracao" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.5 1.1 4.2 2.3.7-1.2 2.1-2.3 4.2-2.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    certo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    errado: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>',
    cadeado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    trofeu: '<svg class="tl-trofeu" viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="48" fill="#5a3aba"/><path d="M32 24h32v10c0 10-7 18-16 18s-16-8-16-18z" fill="#e57145"/><path d="M32 28h-8c0 8 4 13 10 14M64 28h8c0 8-4 13-10 14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M44 52h8v10h-8z" fill="#fff"/><rect x="34" y="62" width="28" height="8" rx="3" fill="#fff"/></svg>'
  };

  // ---------------------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------------------
  function el(tag, classe, html) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function texto(tag, classe, conteudo) {
    var e = el(tag, classe);
    e.textContent = conteudo;
    return e;
  }

  function botao(rotulo, classe, acao) {
    var b = el('button', 'tl-botao ' + (classe || ''));
    b.type = 'button';
    b.innerHTML = rotulo;
    if (acao) b.addEventListener('click', acao);
    return b;
  }

  function normalizar(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function semHtml(html) {
    var d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').trim();
  }

  // ---------------------------------------------------------------------------------------
  // Dados do jogo
  // ---------------------------------------------------------------------------------------
  var jogo, locais, imagemMapa;
  var estado = { feitos: 0, erros: 0, vidas: VIDAS };

  function cenaDe(i) {
    var id = locais[i].id;
    var s = (jogo.scenes || []).filter(function (c) { return c.id == id; })[0];
    if (!s) return null;
    // Cena vazia (o editor do Quill deixa "<p><br></p>") conta como sem cena.
    var temConteudo = semHtml(s.content) !== '' || /<img|<iframe|<video/i.test(s.content || '');
    return temConteudo ? s : null;
  }

  function desafioDe(i) {
    var id = locais[i].id;
    return (jogo.challenges || []).filter(function (c) { return c.id == id; })[0] || null;
  }

  function nota() {
    if (!locais.length) return 0;
    return Math.round(Math.max(0, 1 - estado.erros / locais.length) * 100);
  }

  // ---------------------------------------------------------------------------------------
  // Estrutura da página
  // ---------------------------------------------------------------------------------------
  var ui = {};

  function montar() {
    document.title = jogo.title || 'Tales Ludos';
    var app = el('div', 'tl-app');

    // barra superior
    var topo = el('header', 'tl-topo');
    var logo = el('img');
    logo.src = 'media/tales-ludos.svg';
    logo.alt = 'Tales Ludos';
    topo.appendChild(logo);
    topo.appendChild(texto('h1', '', jogo.title || 'Jogo'));
    var prog = el('div', 'tl-progresso');
    ui.barra = el('span');
    var barra = el('div', 'tl-barra');
    barra.setAttribute('role', 'progressbar');
    barra.setAttribute('aria-label', 'Progresso na trilha');
    barra.setAttribute('aria-valuemin', '0');
    barra.setAttribute('aria-valuemax', String(locais.length));
    barra.appendChild(ui.barra);
    ui.barraEl = barra;
    prog.appendChild(barra);
    ui.progressoTexto = el('span', 'tl-progresso-texto');
    prog.appendChild(ui.progressoTexto);
    topo.appendChild(prog);
    ui.vidas = el('div', 'tl-vidas');
    topo.appendChild(ui.vidas);
    app.appendChild(topo);

    // mapa com a trilha
    var palco = el('main', 'tl-palco');
    ui.mapa = el('div', 'tl-mapa');
    var img = el('img');
    img.src = imagemMapa;
    img.alt = '';
    ui.mapa.appendChild(img);
    var svgNs = 'http://www.w3.org/2000/svg';
    ui.svg = document.createElementNS(svgNs, 'svg');
    ui.svg.setAttribute('viewBox', '0 0 100 100');
    ui.svg.setAttribute('preserveAspectRatio', 'none');
    ui.svg.setAttribute('aria-hidden', 'true');
    ui.mapa.appendChild(ui.svg);
    ui.personagem = el('div', 'tl-personagem');
    ui.mapa.appendChild(ui.personagem);
    palco.appendChild(ui.mapa);
    ui.dica = el('p', 'tl-dica');
    palco.appendChild(ui.dica);
    app.appendChild(palco);

    ui.aviso = el('div', 'tl-sr');
    ui.aviso.setAttribute('aria-live', 'polite');
    app.appendChild(ui.aviso);

    document.body.appendChild(app);
  }

  function anunciar(msg) {
    ui.aviso.textContent = '';
    setTimeout(function () { ui.aviso.textContent = msg; }, 50);
  }

  function desenharVidas(alvo, perdeu) {
    alvo.innerHTML = '';
    alvo.setAttribute('aria-label', estado.vidas + (estado.vidas === 1 ? ' vida' : ' vidas'));
    alvo.setAttribute('role', 'img');
    for (var k = 0; k < VIDAS; k++) {
      var c = el('span', '', ICONE.coracao).firstChild;
      if (k >= estado.vidas) c.classList.add('tl-vazio');
      if (perdeu && k === estado.vidas) c.classList.add('tl-perdeu');
      alvo.appendChild(c);
    }
  }

  function atualizarTopo(perdeu) {
    var n = locais.length;
    ui.barra.style.width = (n ? (estado.feitos / n) * 100 : 0) + '%';
    ui.barraEl.setAttribute('aria-valuenow', String(estado.feitos));
    ui.progressoTexto.textContent = estado.feitos + ' de ' + n;
    desenharVidas(ui.vidas, perdeu);
  }

  // ---------------------------------------------------------------------------------------
  // Trilha
  // ---------------------------------------------------------------------------------------
  function pos(i) {
    return { x: locais[i].x * 100, y: locais[i].y * 100 };
  }

  function desenharTrilha() {
    var svgNs = 'http://www.w3.org/2000/svg';
    ui.svg.innerHTML = '';
    for (var k = 0; k < locais.length - 1; k++) {
      var a = pos(k), b = pos(k + 1);
      var d = 'M' + a.x + ' ' + a.y + ' L' + b.x + ' ' + b.y;
      var borda = document.createElementNS(svgNs, 'path');
      borda.setAttribute('d', d);
      borda.setAttribute('class', 'tl-caminho-borda');
      ui.svg.appendChild(borda);
      var linha = document.createElementNS(svgNs, 'path');
      linha.setAttribute('d', d);
      linha.setAttribute('class', 'tl-caminho' + (k < estado.feitos ? ' tl-feito' : ''));
      ui.svg.appendChild(linha);
    }

    Array.prototype.slice.call(ui.mapa.querySelectorAll('.tl-no, .tl-balao')).forEach(function (n) {
      n.parentNode.removeChild(n);
    });

    locais.forEach(function (_, i) {
      var p = pos(i);
      var no = el('button', 'tl-no');
      no.type = 'button';
      no.style.left = p.x + '%';
      no.style.top = p.y + '%';
      if (i < estado.feitos) {
        no.innerHTML = ICONE.certo;
        no.setAttribute('aria-label', 'Local ' + (i + 1) + ', concluído. Rever a cena');
        no.addEventListener('click', function () { abrirLicao(i, true); });
      } else if (i === estado.feitos) {
        no.classList.add('tl-atual');
        no.textContent = String(i + 1);
        no.setAttribute('aria-label', 'Local ' + (i + 1) + ': começar');
        no.addEventListener('click', function () { abrirLicao(i, false); });
        var balao = texto('button', 'tl-balao', estado.feitos === 0 ? 'Começar' : 'Local ' + (i + 1));
        balao.type = 'button';
        balao.tabIndex = -1;
        balao.style.left = p.x + '%';
        balao.style.top = p.y + '%';
        if (p.y < 22) balao.classList.add('tl-abaixo');
        balao.addEventListener('click', function () { abrirLicao(i, false); });
        ui.mapa.appendChild(balao);
        ui.noAtual = no;
      } else {
        no.classList.add('tl-bloqueado');
        no.innerHTML = ICONE.cadeado;
        no.setAttribute('aria-label', 'Local ' + (i + 1) + ', bloqueado');
        no.setAttribute('aria-disabled', 'true');
      }
      ui.mapa.appendChild(no);
    });

    ui.dica.textContent = estado.feitos < locais.length
      ? 'Toque no local destacado para continuar a trilha.'
      : 'Trilha concluída! Toque em um local para rever a cena.';
    atualizarTopo(false);
  }

  function posicionarPersonagem(i) {
    var p = pos(Math.min(i, locais.length - 1));
    ui.personagem.classList.toggle('tl-direita', p.x < 15);
    ui.personagem.style.transition = 'none';
    ui.personagem.style.left = p.x + '%';
    ui.personagem.style.top = p.y + '%';
    void ui.personagem.offsetWidth;
    ui.personagem.style.transition = '';
  }

  // Personagem caminha do local i ao local i + 1.
  function caminhar(i, depois) {
    if (i + 1 >= locais.length) { depois(); return; }
    var a = pos(i), b = pos(i + 1);
    var pers = ui.personagem;
    pers.classList.toggle('tl-esquerda', b.x < a.x);
    pers.classList.add('tl-andando');
    var fim = false;
    function terminou() {
      if (fim) return;
      fim = true;
      pers.classList.remove('tl-andando');
      depois();
    }
    pers.addEventListener('transitionend', terminou, { once: true });
    setTimeout(terminou, 2200);
    requestAnimationFrame(function () {
      pers.classList.toggle('tl-direita', b.x < 15);
      pers.style.left = b.x + '%';
      pers.style.top = b.y + '%';
    });
  }

  // ---------------------------------------------------------------------------------------
  // Lição: cena e desafio de um local
  // ---------------------------------------------------------------------------------------
  var licao = null; // { i, revisao, fase, desafio, ui... }

  function abrirLicao(i, revisao) {
    var cena = cenaDe(i);
    var desafio = desafioDe(i);
    licao = { i: i, revisao: revisao, cena: cena, desafio: desafio };

    var tela = el('section', 'tl-licao');
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-modal', 'true');
    tela.setAttribute('aria-label', 'Local ' + (i + 1));

    var topo = el('div', 'tl-licao-topo');
    var fechar = el('button', 'tl-fechar', ICONE.fechar);
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Voltar à trilha');
    fechar.addEventListener('click', fecharLicao);
    topo.appendChild(fechar);
    var barra = el('div', 'tl-barra');
    licao.barra = el('span');
    barra.appendChild(licao.barra);
    topo.appendChild(barra);
    licao.vidas = el('div', 'tl-vidas');
    topo.appendChild(licao.vidas);
    tela.appendChild(topo);

    licao.corpo = el('div', 'tl-licao-corpo');
    tela.appendChild(licao.corpo);
    licao.rodape = el('div', 'tl-licao-rodape');
    tela.appendChild(licao.rodape);

    document.body.appendChild(tela);
    licao.tela = tela;
    document.addEventListener('keydown', teclaLicao);

    if (cena || revisao || !desafio) mostrarCena();
    else mostrarDesafio();
  }

  function fecharLicao() {
    if (!licao) return;
    document.removeEventListener('keydown', teclaLicao);
    licao.tela.parentNode.removeChild(licao.tela);
    licao = null;
    atualizarTopo(false);
    if (ui.noAtual && document.body.contains(ui.noAtual)) ui.noAtual.focus();
  }

  function teclaLicao(ev) {
    if (!licao) return;
    if (ev.key === 'Escape') { fecharLicao(); return; }
    if (ev.key === 'Enter' && licao.principal && !licao.principal.disabled &&
        ev.target.tagName !== 'BUTTON' && ev.target.tagName !== 'SELECT') {
      ev.preventDefault();
      licao.principal.click();
    }
  }

  function progressoLicao(etapa) {
    var total = (licao.cena ? 1 : 0) + (licao.desafio ? 1 : 0) || 1;
    licao.barra.style.width = Math.min(100, (etapa / total) * 100) + '%';
    desenharVidas(licao.vidas, false);
  }

  function rodape(classe, conteudoEsq, botoes) {
    var r = licao.rodape;
    r.className = 'tl-licao-rodape' + (classe ? ' ' + classe : '');
    r.innerHTML = '';
    var dentro = el('div', 'tl-licao-rodape-dentro');
    if (conteudoEsq) dentro.appendChild(conteudoEsq);
    var acoes = el('div', 'tl-acoes');
    botoes.forEach(function (b) { acoes.appendChild(b); });
    dentro.appendChild(acoes);
    r.appendChild(dentro);
    licao.principal = botoes[botoes.length - 1];
  }

  function mostrarCena() {
    licao.fase = 'cena';
    progressoLicao(0);
    var c = licao.corpo;
    c.innerHTML = '';
    c.scrollTop = 0;
    c.appendChild(texto('span', 'tl-rotulo', 'Local ' + (licao.i + 1) + ' · Cena'));
    var conteudo = el('div', 'tl-conteudo', licao.cena ? licao.cena.content : '<p>Este local não tem cena.</p>');
    c.appendChild(conteudo);

    if (licao.revisao) {
      rodape('', null, [botao('Voltar à trilha', '', fecharLicao)]);
    } else if (licao.desafio) {
      rodape('', null, [botao('Continuar', '', mostrarDesafio)]);
    } else {
      rodape('', null, [botao('Continuar', '', concluirLocal)]);
    }
    licao.principal.focus();
  }

  // Monta o desafio. Cada tipo devolve { resposta(): valor|null, corrigir(): boolean }.
  function mostrarDesafio() {
    licao.fase = 'desafio';
    progressoLicao(licao.cena ? 1 : 0);
    var d = licao.desafio;
    var c = licao.corpo;
    c.innerHTML = '';
    c.scrollTop = 0;
    c.appendChild(texto('span', 'tl-rotulo tl-rotulo-desafio', 'Local ' + (licao.i + 1) + ' · Desafio'));

    var tipo = Number(d.type);
    var area = el('div');
    c.appendChild(area);
    var verificar = botao('Verificar', 'tl-botao-laranja', verificarResposta);
    var mudou = function () { verificar.disabled = licao.ctrl.resposta() == null; };

    if (tipo === 2) licao.ctrl = desafioEscolha(area, d, mudou);
    else if (tipo === 3) licao.ctrl = desafioLacunas(area, d, mudou);
    else if (tipo === 4) licao.ctrl = desafioAssociacao(area, d, mudou);
    else if (tipo === 5) licao.ctrl = desafioRespostaCurta(area, d, mudou);
    else licao.ctrl = desafioVerdadeiroFalso(area, d, mudou);

    rodape('', null, [verificar]);
    verificar.disabled = true;
    var primeiro = area.querySelector('input, select, .tl-opcao');
    if (primeiro) primeiro.focus();
  }

  function grupoOpcoes(area, itens, duas, mudou) {
    var lista = el('div', 'tl-opcoes' + (duas ? ' tl-duas' : ''));
    lista.setAttribute('role', 'radiogroup');
    var escolhido = null;
    var botoes = itens.map(function (item, k) {
      var b = el('button', 'tl-opcao');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.appendChild(texto('span', 'tl-letra', String.fromCharCode(65 + k)));
      b.appendChild(texto('span', '', item.rotulo));
      b.addEventListener('click', function () {
        escolhido = item.valor;
        botoes.forEach(function (o) { o.setAttribute('aria-checked', o === b ? 'true' : 'false'); });
        mudou();
      });
      lista.appendChild(b);
      return b;
    });
    area.appendChild(lista);
    return {
      valor: function () { return escolhido; },
      marcar: function (certo) {
        botoes.forEach(function (o) {
          if (o.getAttribute('aria-checked') === 'true') o.classList.add(certo ? 'tl-certa' : 'tl-errada');
          o.disabled = true;
        });
      }
    };
  }

  function desafioVerdadeiroFalso(area, d, mudou) {
    area.appendChild(el('div', 'tl-conteudo tl-pergunta', d.content || ''));
    var g = grupoOpcoes(area, [{ rotulo: 'Verdadeiro', valor: true }, { rotulo: 'Falso', valor: false }], true, mudou);
    return {
      resposta: g.valor,
      corrigir: function () {
        var ok = g.valor() === !!d.correct;
        g.marcar(ok);
        return ok;
      }
    };
  }

  function desafioEscolha(area, d, mudou) {
    area.appendChild(el('div', 'tl-conteudo tl-pergunta', d.content || ''));
    var itens = [];
    (d.options || []).forEach(function (o, k) {
      if (o && String(o.text || '').trim() !== '') itens.push({ rotulo: o.text, valor: k });
    });
    var g = grupoOpcoes(area, itens, false, mudou);
    return {
      resposta: g.valor,
      corrigir: function () {
        var ok = g.valor() === Number(d.correctOptionIndex);
        g.marcar(ok);
        return ok;
      }
    };
  }

  function desafioLacunas(area, d, mudou) {
    var respostas = [];
    var html = String(d.content || '').replace(/\$(.*?)\$/g, function (_, palavra) {
      respostas.push(semHtml(palavra));
      return '<input type="text" class="tl-lacuna" autocomplete="off" aria-label="Lacuna ' + respostas.length + '">';
    });
    area.appendChild(el('div', 'tl-conteudo tl-pergunta', html));
    var campos = Array.prototype.slice.call(area.querySelectorAll('.tl-lacuna'));
    campos.forEach(function (c) { c.addEventListener('input', mudou); });
    return {
      resposta: function () {
        return campos.every(function (c) { return c.disabled || c.value.trim() !== ''; }) ? true : null;
      },
      corrigir: function () {
        var ok = true;
        campos.forEach(function (c, k) {
          var certo = normalizar(c.value) === normalizar(respostas[k]);
          c.classList.toggle('tl-certa', certo);
          c.classList.toggle('tl-errada', !certo);
          if (certo) c.disabled = true;
          else ok = false;
        });
        return ok;
      }
    };
  }

  function desafioAssociacao(area, d, mudou) {
    if (d.content && semHtml(d.content)) area.appendChild(el('div', 'tl-conteudo tl-pergunta', d.content));
    var pares = (d.associations || []).filter(function (a) {
      return String(a.text || '').trim() !== '' && String(a.associated || '').trim() !== '';
    });
    var alvos = embaralhar(pares.map(function (a) { return a.associated; }));
    var caixa = el('div', 'tl-associacao');
    var seletores = pares.map(function (p, k) {
      var linha = el('div');
      linha.appendChild(texto('div', 'tl-item', p.text));
      linha.appendChild(texto('span', 'tl-seta', '→'));
      var s = el('select');
      s.setAttribute('aria-label', 'Associação de ' + p.text);
      s.appendChild(texto('option', '', 'Selecione…')).value = '';
      alvos.forEach(function (a) { s.appendChild(texto('option', '', a)).value = a; });
      s.addEventListener('change', mudou);
      linha.appendChild(s);
      caixa.appendChild(linha);
      return s;
    });
    area.appendChild(caixa);
    return {
      resposta: function () {
        return seletores.every(function (s) { return s.value !== ''; }) ? true : null;
      },
      corrigir: function () {
        var ok = true;
        seletores.forEach(function (s, k) {
          var certo = s.value === pares[k].associated;
          s.classList.toggle('tl-certa', certo);
          s.classList.toggle('tl-errada', !certo);
          if (certo) s.disabled = true;
          else ok = false;
        });
        return ok;
      }
    };
  }

  function desafioRespostaCurta(area, d, mudou) {
    area.appendChild(el('div', 'tl-conteudo tl-pergunta', d.content || ''));
    var campo = el('input', 'tl-campo');
    campo.type = 'text';
    campo.autocomplete = 'off';
    campo.placeholder = 'Digite a sua resposta';
    campo.setAttribute('aria-label', 'Resposta');
    campo.addEventListener('input', mudou);
    area.appendChild(campo);
    return {
      resposta: function () { return campo.value.trim() !== '' ? campo.value : null; },
      corrigir: function () {
        var ok = normalizar(campo.value) === normalizar(d.answer);
        campo.classList.toggle('tl-certa', ok);
        campo.classList.toggle('tl-errada', !ok);
        campo.disabled = true;
        return ok;
      }
    };
  }

  function resultado(icone, titulo, detalhe) {
    var r = el('div', 'tl-resultado');
    r.appendChild(el('div', 'tl-resultado-icone', icone));
    var t = el('div');
    t.appendChild(texto('strong', '', titulo));
    if (detalhe) t.appendChild(texto('span', '', detalhe));
    r.appendChild(t);
    return r;
  }

  function verificarResposta() {
    if (licao.ctrl.resposta() == null) return;
    var ok = licao.ctrl.corrigir();
    if (ok) {
      progressoLicao((licao.cena ? 1 : 0) + 1);
      anunciar('Resposta correta.');
      rodape('tl-ok', resultado(ICONE.certo, 'Muito bem!', 'Resposta correta.'),
        [botao('Continuar', '', concluirLocal)]);
      licao.principal.focus();
      return;
    }

    estado.erros++;
    estado.vidas = Math.max(0, estado.vidas - 1);
    desenharVidas(licao.vidas, true);
    desenharVidas(ui.vidas, false);
    guardarProgresso();

    if (estado.vidas > 0) {
      anunciar('Resposta incorreta. Você perdeu uma vida.');
      var botoes = [];
      if (licao.cena) botoes.push(botao('Rever a cena', 'tl-botao-claro', mostrarCena));
      botoes.push(botao('Tentar de novo', 'tl-botao-laranja', mostrarDesafio));
      rodape('tl-erro', resultado(ICONE.errado, 'Resposta incorreta',
        'Você perdeu uma vida. ' + (estado.vidas === 1 ? 'Resta 1.' : 'Restam ' + estado.vidas + '.')), botoes);
    } else {
      anunciar('Suas vidas acabaram.');
      rodape('tl-erro', resultado(ICONE.coracao.replace('tl-coracao', 'tl-coracao tl-vazio'), 'Suas vidas acabaram',
        'Leia a cena com atenção e tente outra vez. Você ganhou ' + VIDAS + ' vidas novas.'),
        [botao(licao.cena ? 'Rever a cena' : 'Tentar de novo', 'tl-botao-laranja', function () {
          estado.vidas = VIDAS;
          desenharVidas(ui.vidas, false);
          guardarProgresso();
          if (licao.cena) mostrarCena(); else mostrarDesafio();
        })]);
    }
    licao.principal.focus();
  }

  function concluirLocal() {
    var i = licao.i;
    fecharLicao();
    if (i !== estado.feitos) return;
    estado.feitos++;
    guardarProgresso();
    desenharTrilha();
    anunciar('Local ' + (i + 1) + ' concluído.');
    caminhar(i, function () {
      if (estado.feitos >= locais.length) fimDeJogo();
      else if (ui.noAtual) ui.noAtual.focus();
    });
  }

  // ---------------------------------------------------------------------------------------
  // Apresentação e fim
  // ---------------------------------------------------------------------------------------
  function telaCartao(titulo, corpo, botoes) {
    var tela = el('div', 'tl-tela');
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-modal', 'true');
    tela.setAttribute('aria-label', titulo);
    var cartao = el('div', 'tl-cartao');
    var topo = el('div', 'tl-cartao-topo');
    var logo = el('img');
    logo.src = 'media/tales-ludos.svg';
    logo.alt = '';
    topo.appendChild(logo);
    topo.appendChild(texto('h2', '', titulo));
    cartao.appendChild(topo);
    var c = el('div', 'tl-cartao-corpo');
    c.appendChild(corpo);
    cartao.appendChild(c);
    var r = el('div', 'tl-cartao-rodape');
    botoes.forEach(function (b) { r.appendChild(b); });
    cartao.appendChild(r);
    tela.appendChild(cartao);
    document.body.appendChild(tela);
    if (botoes.length) botoes[botoes.length - 1].focus();
    return tela;
  }

  function apresentacao(retomando) {
    var corpo = el('div');
    corpo.appendChild(el('div', 'tl-conteudo', jogo.introduce || ''));
    var regras = el('div', 'tl-regras');
    regras.appendChild(texto('span', '', '📍 ' + locais.length + (locais.length === 1 ? ' local na trilha' : ' locais na trilha')));
    regras.appendChild(texto('span', '', '❤ ' + VIDAS + ' vidas: cada erro custa uma'));
    regras.appendChild(texto('span', '', '✓ Acerte o desafio para liberar o próximo local'));
    corpo.appendChild(regras);
    var tela;
    var comecar = botao(retomando ? 'Continuar de onde parei' : 'Começar a trilha', 'tl-botao-laranja', function () {
      tela.parentNode.removeChild(tela);
      if (ui.noAtual) ui.noAtual.focus();
    });
    tela = telaCartao(jogo.title || 'Tales Ludos', corpo, [comecar]);
  }

  function fimDeJogo() {
    var n = nota();
    if (window.TLScorm) window.TLScorm.concluir(n);
    var corpo = el('div', 'tl-fim');
    corpo.appendChild(el('div', '', ICONE.trofeu));
    corpo.appendChild(texto('div', 'tl-fim-numero', n + '%'));
    corpo.appendChild(texto('h3', '', n > 50 ? 'Parabéns! Você concluiu a trilha.' : 'Você concluiu a trilha!'));
    corpo.appendChild(texto('p', '', n > 50
      ? 'Você acertou ' + n + '% das questões.'
      : 'Erros acontecem, é importante aprender com eles. Que tal jogar de novo?'));
    var det = el('div', 'tl-fim-detalhes');
    var a = el('div'); a.appendChild(texto('strong', '', String(locais.length))); a.appendChild(texto('span', '', 'locais'));
    var b = el('div'); b.appendChild(texto('strong', '', String(estado.erros))); b.appendChild(texto('span', '', estado.erros === 1 ? 'erro' : 'erros'));
    det.appendChild(a); det.appendChild(b);
    corpo.appendChild(det);
    var tela;
    tela = telaCartao('Trilha concluída', corpo, [
      botao('Ver a trilha', 'tl-botao-claro', function () { tela.parentNode.removeChild(tela); }),
      botao('Jogar de novo', 'tl-botao-laranja', function () {
        tela.parentNode.removeChild(tela);
        estado = { feitos: 0, erros: 0, vidas: VIDAS };
        if (window.TLScorm) window.TLScorm.recomecar();
        desenharTrilha();
        posicionarPersonagem(0);
        apresentacao(false);
      })
    ]);
    anunciar('Trilha concluída. Nota: ' + n + '%.');
    if (n > 50) confete();
  }

  function confete() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = el('canvas', 'tl-confete');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    var cores = ['#5a3aba', '#e57145', '#ffffff', '#eeeaf8', '#f39a75'];
    var pecas = [];
    for (var k = 0; k < 140; k++) {
      pecas.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.6,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        t: 6 + Math.random() * 6, cor: cores[k % cores.length]
      });
    }
    var inicio = performance.now();
    (function quadro(agora) {
      ctx.clearRect(0, 0, w, h);
      pecas.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.cor;
        ctx.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
        ctx.restore();
      });
      if (agora - inicio < 4500) requestAnimationFrame(quadro);
      else canvas.parentNode.removeChild(canvas);
    })(inicio);
  }

  // ---------------------------------------------------------------------------------------
  // Progresso (SCORM)
  // ---------------------------------------------------------------------------------------
  function guardarProgresso() {
    if (window.TLScorm && estado.feitos < locais.length) window.TLScorm.guardar(estado);
  }

  function restaurar(salvo) {
    if (!salvo || typeof salvo !== 'object') return false;
    var f = Number(salvo.feitos), e = Number(salvo.erros), v = Number(salvo.vidas);
    if (!(f >= 0 && f < locais.length) || !(e >= 0) || !(v >= 1 && v <= VIDAS)) return false;
    estado = { feitos: Math.floor(f), erros: Math.floor(e), vidas: Math.floor(v) };
    return estado.feitos > 0 || estado.erros > 0;
  }

  // ---------------------------------------------------------------------------------------
  // Início
  // ---------------------------------------------------------------------------------------
  function iniciar() {
    jogo = window.game;
    var mapa = document.getElementById('mapa');
    if (!jogo || !mapa) {
      document.body.appendChild(texto('p', 'tl-mensagem', 'Não foi possível carregar o jogo.'));
      return;
    }
    imagemMapa = mapa.src;
    locais = (jogo.marks && jogo.marks.coords) || [];

    var salvo = window.TLScorm ? window.TLScorm.iniciar() : null;
    var retomando = restaurar(salvo);

    montar();
    if (!locais.length) {
      ui.dica.textContent = 'Este jogo ainda não tem locais marcados no mapa.';
      atualizarTopo(false);
      return;
    }
    desenharTrilha();
    posicionarPersonagem(estado.feitos);
    apresentacao(retomando);
  }

  window.TalesLudos = { iniciar: iniciar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

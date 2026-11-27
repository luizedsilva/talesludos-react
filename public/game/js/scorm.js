// Comunicação com o LMS (Moodle etc.) pelo SCORM 1.2.
// Fora de um LMS (arquivo aberto direto, site, visualização no editor) tudo vira "sem efeito".
(function () {
  'use strict';

  var api = null;
  var iniciado = false;
  var finalizado = false;

  // Procura a API SCORM 1.2 (objeto "API") nas janelas-mãe e na janela que abriu esta.
  function procurar(janela) {
    var tentativas = 0;
    try {
      while (janela && !janela.API && janela.parent && janela.parent !== janela && tentativas < 10) {
        tentativas++;
        janela = janela.parent;
      }
      return janela && janela.API ? janela.API : null;
    } catch (e) {
      return null; // janela de outra origem
    }
  }

  function chamar(nome) {
    if (!api) return '';
    try {
      var args = Array.prototype.slice.call(arguments, 1);
      return api[nome].apply(api, args);
    } catch (e) {
      return '';
    }
  }

  function obter(campo) { return String(chamar('LMSGetValue', campo) || ''); }
  function definir(campo, valor) { return chamar('LMSSetValue', campo, String(valor)); }
  function salvar() { return chamar('LMSCommit', ''); }

  var Scorm = {
    // Inicia a sessão. Devolve o progresso salvo numa sessão anterior (ou null).
    iniciar: function () {
      api = procurar(window) || (window.opener ? procurar(window.opener) : null);
      if (!api) return null;
      iniciado = String(chamar('LMSInitialize', '')) === 'true';
      if (!iniciado) { api = null; return null; }

      var situacao = obter('cmi.core.lesson_status');
      if (situacao === 'not attempted' || situacao === '') {
        definir('cmi.core.lesson_status', 'incomplete');
        salvar();
      }
      var dados = obter('cmi.suspend_data');
      if (dados && situacao === 'incomplete') {
        try { return JSON.parse(dados); } catch (e) { return null; }
      }
      return null;
    },

    ativo: function () { return !!api; },

    // Guarda o progresso para o aluno continuar depois.
    guardar: function (estado) {
      if (!api) return;
      definir('cmi.suspend_data', JSON.stringify(estado));
      definir('cmi.core.lesson_location', String(estado.feitos || 0));
      definir('cmi.core.exit', 'suspend');
      salvar();
    },

    // Fim da trilha: envia a nota (0 a 100) e marca a atividade como concluída.
    concluir: function (nota) {
      if (!api) return;
      definir('cmi.core.score.min', 0);
      definir('cmi.core.score.max', 100);
      definir('cmi.core.score.raw', Math.round(nota));
      definir('cmi.core.lesson_status', 'completed');
      definir('cmi.suspend_data', '');
      definir('cmi.core.exit', '');
      salvar();
    },

    // Recomeço (jogar de novo): limpa o progresso guardado, mantendo a nota já enviada.
    recomecar: function () {
      if (!api) return;
      definir('cmi.suspend_data', '');
      salvar();
    },

    encerrar: function () {
      if (!api || finalizado) return;
      finalizado = true;
      salvar();
      chamar('LMSFinish', '');
    }
  };

  window.addEventListener('pagehide', Scorm.encerrar);
  window.addEventListener('beforeunload', Scorm.encerrar);
  window.TLScorm = Scorm;
})();

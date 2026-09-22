/**
 * Recebedor das notas da prova do Sistema Cardiovascular — E.E.E.F.M. Feliz Lusitânia.
 *
 * Cada prova entregue vira uma linha na planilha E um e-mail para o professor.
 * A planilha é organizada por turma: uma aba para cada sala (801M, 802M, ...),
 * com os alunos em ordem alfabética, mais uma aba "Resumo" com as médias.
 *
 * O passo a passo de publicação está no README, na seção "Envio das notas".
 *
 * Este arquivo é só uma cópia de referência guardada no repositório: quem roda
 * de verdade é a cópia colada no editor do Google Apps Script.
 */

/* ====================== o que você pode ajustar ====================== */

// Para onde vão os e-mails. Em branco = usa o e-mail da conta que publicou.
// Para mais de um destinatário, separe por vírgula dentro das mesmas aspas.
var EMAIL_PROFESSOR = "amauri.junior@escola.seduc.pa.gov.br";

// false desliga o e-mail por aluno e mantém só a planilha.
var ENVIAR_EMAIL = true;

// Ordem das abas na planilha. Turma que chegar e não estiver aqui vira aba
// no fim da lista, então pode deixar como está se mudar de sala.
var TURMAS = ["801M", "802M", "803M", "801T", "802T"];

var TOTAL_QUESTOES = 20;
var VALOR_QUESTAO = 0.5;

/* ===================================================================== */

var FIXAS = ["Aluno(a)", "Nota", "Certas", "Parciais", "Zeradas", "Entregue em", "Recebido em"];

function cabecalho() {
  var c = FIXAS.slice();
  for (var i = 1; i <= TOTAL_QUESTOES; i++) c.push("Q" + i);
  c.push("ID");
  return c;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, erro: "requisição sem conteúdo" });
    }
    var r = JSON.parse(e.postData.contents);
    if (!r.nome || !r.turma) {
      return responder({ ok: false, erro: "faltou nome ou turma" });
    }

    // A mesma nota pode chegar duas vezes se o aparelho perder a rede no meio
    // do envio e tentar de novo. O ID descarta a repetição.
    var folha = abaDaTurma(r.turma);
    if (jaRegistrado(folha, r.id)) {
      return responder({ ok: true, repetido: true });
    }

    gravar(folha, r);

    // A nota já está salva. Resumo e e-mail são extras: se algum falhar
    // (cota de e-mail do dia estourada, por exemplo), o aluno não pode ver
    // "falha no envio" na tela nem o aparelho reenviar à toa.
    try { atualizarResumo(); } catch (x) { registrarFalha("resumo", x); }
    if (ENVIAR_EMAIL) {
      try { enviarEmail(r); } catch (x) { registrarFalha("e-mail de " + r.nome, x); }
    }

    return responder({ ok: true });
  } catch (erro) {
    return responder({ ok: false, erro: String(erro) });
  }
}

// Abrir a URL no navegador responde isto — serve para conferir a publicação.
function doGet() {
  return responder({ ok: true, servico: "recebedor de notas no ar" });
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------- planilha, uma aba por turma ---------------------- */

function abaDaTurma(turma) {
  var nome = String(turma).replace(/[\[\]\*\/\\\?:]/g, "").trim().substring(0, 90) || "Sem turma";
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var folha = planilha.getSheetByName(nome);

  if (!folha) {
    folha = planilha.insertSheet(nome, posicaoDaTurma(planilha, nome));
    var cab = cabecalho();
    folha.appendRow(cab);
    folha.getRange(1, 1, 1, cab.length).setFontWeight("bold").setBackground("#EEF2F7");
    folha.setFrozenRows(1);
    folha.setFrozenColumns(2);
    folha.setColumnWidth(1, 260);
    folha.getRange(1, FIXAS.length + 1, 1, TOTAL_QUESTOES).setFontSize(9);
  }
  return folha;
}

// Mantém as abas na ordem da lista TURMAS, com "Resumo" sempre na frente.
function posicaoDaTurma(planilha, nome) {
  var i = TURMAS.indexOf(nome);
  if (i < 0) return planilha.getNumSheets() + 1;
  var antes = 1; // a aba Resumo
  for (var j = 0; j < i; j++) {
    if (planilha.getSheetByName(TURMAS[j])) antes++;
  }
  return antes + 1;
}

function jaRegistrado(folha, id) {
  if (!id) return false;
  var ultima = folha.getLastRow();
  if (ultima < 2) return false;
  var col = cabecalho().length; // ID é a última coluna
  var ids = folha.getRange(2, col, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return true;
  }
  return false;
}

function gravar(folha, r) {
  var linha = [
    r.nome,
    Number(r.nota),
    Number(r.certas || 0),
    Number(r.parciais || 0),
    Number(r.zeradas || 0),
    r.entregue || "",
    new Date()
  ];
  var q = r.questoes || [];
  for (var i = 0; i < TOTAL_QUESTOES; i++) {
    linha.push(q[i] === undefined || q[i] === null ? "" : Number(q[i]));
  }
  linha.push(r.id || "");

  var destino = linhaEmOrdemAlfabetica(folha, r.nome);
  if (destino <= folha.getLastRow()) {
    folha.insertRowBefore(destino);
  }
  folha.getRange(destino, 1, 1, linha.length).setValues([linha]);

  // Nota com uma casa decimal e destaque para quem ficou abaixo da média.
  var celulaNota = folha.getRange(destino, 2);
  celulaNota.setNumberFormat("0.0");
  celulaNota.setFontWeight("bold");
  celulaNota.setBackground(Number(r.nota) < 6 ? "#FBE3E6" : "#DFF3E7");
  folha.getRange(destino, 7).setNumberFormat("dd/MM/yyyy HH:mm");
  folha.getRange(destino, FIXAS.length + 1, 1, TOTAL_QUESTOES).setNumberFormat("0.00");
}

// Devolve a linha onde o aluno deve entrar para a lista seguir em ordem A-Z.
function linhaEmOrdemAlfabetica(folha, nome) {
  var ultima = folha.getLastRow();
  if (ultima < 2) return 2;
  var nomes = folha.getRange(2, 1, ultima - 1, 1).getValues();
  var alvo = chaveOrdem(nome);
  for (var i = 0; i < nomes.length; i++) {
    if (chaveOrdem(nomes[i][0]) > alvo) return i + 2;
  }
  return ultima + 1;
}

// Tira acentos e maiúsculas para "Ângela" não cair depois de "Bruno".
function chaveOrdem(s) {
  return String(s == null ? "" : s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().trim();
}

/* ------------------------------- resumo ------------------------------- */

function atualizarResumo() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var folha = planilha.getSheetByName("Resumo");
  if (!folha) {
    folha = planilha.insertSheet("Resumo", 0);
  }
  folha.clear();

  var cab = ["Turma", "Alunos", "Média", "Maior", "Menor", "Abaixo de 6,0"];
  folha.appendRow(cab);
  folha.getRange(1, 1, 1, cab.length).setFontWeight("bold").setBackground("#EEF2F7");
  folha.setFrozenRows(1);
  folha.setColumnWidth(1, 140);

  var todas = [];
  planilha.getSheets().forEach(function (f) {
    var nome = f.getName();
    if (nome === "Resumo" || f.getLastRow() < 2) return;
    var notas = f.getRange(2, 2, f.getLastRow() - 1, 1).getValues()
      .map(function (l) { return Number(l[0]); })
      .filter(function (n) { return !isNaN(n); });
    if (!notas.length) return;
    todas = todas.concat(notas);
    folha.appendRow([nome, notas.length, media(notas), Math.max.apply(null, notas),
                     Math.min.apply(null, notas), notas.filter(function (n) { return n < 6; }).length]);
  });

  if (todas.length) {
    var linha = folha.getLastRow() + 1;
    folha.appendRow(["TOTAL", todas.length, media(todas), Math.max.apply(null, todas),
                     Math.min.apply(null, todas), todas.filter(function (n) { return n < 6; }).length]);
    folha.getRange(linha, 1, 1, cab.length).setFontWeight("bold").setBackground("#F4F6FA");
  }
  if (folha.getLastRow() > 1) {
    folha.getRange(2, 3, folha.getLastRow() - 1, 3).setNumberFormat("0.0");
  }
  folha.getRange(folha.getLastRow() + 2, 1)
    .setValue("Atualizado em " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"))
    .setFontColor("#777");
}

function media(ns) {
  var s = 0;
  for (var i = 0; i < ns.length; i++) s += ns[i];
  return Math.round((s / ns.length) * 10) / 10;
}

/* -------------------------------- e-mail -------------------------------- */

function enviarEmail(r) {
  var para = EMAIL_PROFESSOR || Session.getEffectiveUser().getEmail();
  var nota = String(r.nota).replace(".", ",");

  var assunto = "[Cardiovascular] " + r.turma + " — " + r.nome + " — nota " + nota;

  var celulas = (r.questoes || []).map(function (p, i) {
    var cor = p >= VALOR_QUESTAO - 0.001 ? "#DFF3E7" : (p > 0 ? "#FDF0D9" : "#FBE3E6");
    var letra = p >= VALOR_QUESTAO - 0.001 ? "#237A4B" : (p > 0 ? "#9A5B00" : "#C62839");
    return '<td style="background:' + cor + ';color:' + letra + ';border:1px solid #fff;' +
           'padding:6px 4px;text-align:center;font-size:12px;width:5%">' +
           "<b>" + (i + 1) + "</b><br>" + String(p).replace(".", ",") + "</td>";
  });

  var linhas = "";
  for (var i = 0; i < celulas.length; i += 10) {
    linhas += "<tr>" + celulas.slice(i, i + 10).join("") + "</tr>";
  }

  var corpo =
    '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:640px">' +
      '<h2 style="margin:0 0 .2rem">' + escapar(r.nome) + "</h2>" +
      '<p style="margin:0;color:#555">Turma ' + escapar(r.turma) +
        " · entregue em " + escapar(r.entregue || "") + "</p>" +
      '<p style="font-size:2rem;font-weight:700;margin:1rem 0 .2rem">' + nota + " / 10,0</p>" +
      '<p style="margin:0;color:#555">' +
        r.certas + " questões certas · " + r.parciais + " em parte · " + r.zeradas + " zeradas</p>" +
      '<hr style="margin:1.2rem 0;border:0;border-top:1px solid #ddd">' +
      '<h3 style="margin:0 0 .6rem">Pontos por questão</h3>' +
      '<table style="border-collapse:collapse;width:100%">' + linhas + "</table>" +
      '<hr style="margin:1.2rem 0;border:0;border-top:1px solid #ddd">' +
      '<p style="font-size:.8rem;color:#777">' +
        "Enviado automaticamente pelo aplicativo de avaliação · E.E.E.F.M. Feliz Lusitânia" +
      "</p>" +
    "</div>";

  MailApp.sendEmail({ to: para, subject: assunto, htmlBody: corpo });
}

function escapar(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function registrarFalha(oque, erro) {
  try {
    console.error("Falhou: " + oque + " — " + erro);
  } catch (x) {}
}

/* --------------------- resumo do dia (opcional) ---------------------
 * Um e-mail só, com todas as notas do dia separadas por turma.
 * Serve para quem prefere não receber um e-mail por aluno: basta pôr
 * ENVIAR_EMAIL = false lá em cima e agendar esta função para rodar
 * uma vez por dia (Acionadores > Adicionar acionador > Por tempo).
 * -------------------------------------------------------------------- */

function enviarResumoDoDia() {
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  var colRecebido = FIXAS.indexOf("Recebido em") + 1;

  var blocos = [], quantos = 0;
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (f) {
    if (f.getName() === "Resumo" || f.getLastRow() < 2) return;
    var linhas = f.getRange(2, 1, f.getLastRow() - 1, colRecebido).getValues()
      .filter(function (l) {
        var d = l[colRecebido - 1];
        return d instanceof Date && d >= hoje;
      });
    if (!linhas.length) return;
    quantos += linhas.length;

    var itens = linhas.map(function (l) {
      return '<tr><td style="padding:4px 10px 4px 0">' + escapar(l[0]) + "</td>" +
             '<td style="padding:4px 0;font-weight:700;text-align:right">' +
             String(l[1]).replace(".", ",") + "</td></tr>";
    }).join("");

    var notas = linhas.map(function (l) { return Number(l[1]); });
    blocos.push('<h3 style="margin:1.4rem 0 .3rem">' + escapar(f.getName()) + "</h3>" +
                '<p style="margin:0 0 .4rem;color:#555">' + linhas.length +
                " prova(s) · média " + String(media(notas)).replace(".", ",") + "</p>" +
                '<table style="border-collapse:collapse">' + itens + "</table>");
  });

  if (!quantos) return;

  var dia = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  MailApp.sendEmail({
    to: EMAIL_PROFESSOR || Session.getEffectiveUser().getEmail(),
    subject: "[Cardiovascular] Notas de " + dia + " — " + quantos + " prova(s)",
    htmlBody: '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:640px">' +
              "<h2>Notas de " + dia + "</h2>" + blocos.join("") + "</div>"
  });
}

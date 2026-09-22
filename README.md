# Prova — Aparelho Cardiovascular (6º ano)

3ª Avaliação de Ciências, Física e Biologia — **Sistema cardiovascular**
E.E.E.F.M. Feliz Lusitânia (SEDUC-Pará) — Prof. Amauri Silva Junior

## Como usar

Abra o link da prova no celular, tablet ou Chromebook. O aluno digita o nome,
escolhe a sala e responde. Ao entregar, a nota aparece na tela com o
detalhamento de cada questão, para mostrar ao professor.

## Como funciona

- 20 questões, 0,5 ponto cada, total de 10,0 pontos.
- **Uma questão por tela**, sem rolagem: a página se ajusta sozinha ao
  tamanho do aparelho para que a questão caiba inteira.
- 14 questões de múltipla escolha e 6 interativas: ligar, arrastar (2),
  ordenar, tocar na cavidade do coração e completar lacunas.
- Nas interativas, a correção é parcial: cada parte certa vale sua fração
  dos 0,5 pontos.
- As respostas ficam salvas no próprio aparelho (`localStorage`), então a
  prova sobrevive a um fechamento acidental do navegador.
- Depois da entrega, as respostas ficam travadas.

Página única, sem servidor e sem coleta de dados: nada sai do aparelho do aluno.

## Envio das notas

A prova pode mandar a nota sozinha, assim que o aluno entrega, para uma
planilha do Google e para o e-mail do professor. Enquanto isso não for
configurado, a prova funciona normalmente e a nota só aparece na tela.

A planilha fica **organizada por turma**: uma aba para cada sala (801M, 802M,
803M, 801T, 802T), com os alunos em ordem alfabética, e uma aba **Resumo** com
quantidade, média, maior e menor nota de cada turma.

Em cada aba de turma:

| Aluno(a) | Nota | Certas | Parciais | Zeradas | Entregue em | Recebido em | Q1…Q20 | ID |
|---|---|---|---|---|---|---|---|---|

As colunas Q1 a Q20 trazem os pontos de cada questão, o que mostra de relance
qual questão a turma inteira errou. Notas abaixo de 6,0 saem com fundo vermelho.

### Passo a passo (uma vez só)

1. Em <https://drive.google.com>, crie uma **Planilha Google** em branco e dê um
   nome, por exemplo *Notas — Cardiovascular*. Não precisa criar abas nem
   cabeçalhos: o script cria tudo sozinho na primeira prova que chegar.
2. Nessa planilha, vá em **Extensões > Apps Script**.
3. Apague o conteúdo do editor, cole todo o arquivo
   [`apps-script/Codigo.gs`](apps-script/Codigo.gs) e salve (💾).
4. Clique em **Implantar > Nova implantação**. No tipo (engrenagem), escolha
   **App da Web** e preencha:
   - *Executar como*: **Eu**
   - *Quem pode acessar*: **Qualquer pessoa**
5. Clique em **Implantar** e autorize o acesso. Vai aparecer um aviso do Google
   dizendo que o app não é verificado: em **Avançado > Acessar (nome do
   projeto)**, confirme. O aviso é esperado, porque o script é seu e não passou
   pela revisão pública do Google.
6. Copie a **URL do app da Web** (termina em `/exec`).
7. Abra o arquivo `index.html`, procure a linha `const ENVIO_URL = '';` (perto do
   começo do script) e cole a URL entre as aspas. Envie a alteração ao GitHub.

### Conferindo antes da aula

- Cole a URL `/exec` no navegador: deve responder
  `{"ok":true,"servico":"recebedor de notas no ar"}`.
- Faça a prova você mesmo até o fim. Na tela da nota deve aparecer
  **✔ Nota enviada ao professor**, e a linha deve surgir na planilha.
- Se aparecer o aviso de sem conexão, a nota fica guardada no aparelho e é
  enviada sozinha quando a internet voltar. Nenhuma nota se perde, e o botão
  **Tentar enviar de novo** força a tentativa.

### E-mail

Por padrão, cada prova entregue gera um e-mail para
`amauri.junior@escola.seduc.pa.gov.br`, com a nota e os pontos de cada questão.
Para mudar o destinatário, edite `EMAIL_PROFESSOR` no início do script.

Atenção à cota do Google: contas `@gmail.com` enviam no máximo **100 e-mails por
dia**; contas institucionais do Google Workspace, 1500. Cinco turmas de 35 alunos
dão 175 e-mails e estouram a cota de uma conta comum — nesse caso a nota
continua indo para a planilha, só o e-mail deixa de sair.

Para receber **um e-mail só por dia**, com todas as notas separadas por turma:

1. No script, troque `var ENVIAR_EMAIL = true;` por `false`.
2. No editor do Apps Script, abra **Acionadores** (o relógio, à esquerda) e clique
   em **Adicionar acionador**.
3. Função: `enviarResumoDoDia` · Origem: **Baseado no tempo** · Tipo: **Diário** ·
   Horário: o de sua preferência.

### Privacidade

Nada é coletado além do que o aluno digita: nome, sala e as respostas. As notas
vão só para a sua planilha e o seu e-mail. Enquanto o aluno não entrega, tudo
fica apenas no aparelho dele.

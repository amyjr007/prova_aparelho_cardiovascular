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

## As notas

Quando o aluno entrega, a prova manda a nota para o **mesmo Formulário Google
que o app de Ligações Químicas já usa**. Não há nada para configurar: já está
ligado. As notas caem naquela planilha que você já conhece.

Cada prova entregue vira uma linha com seis campos:

| Campo | O que vem | Exemplo |
|---|---|---|
| Nome | o que o aluno digitou | Ângela Souza Lima |
| Turma | a sala escolhida na capa | 802T |
| Turno | deduzido da sala (M ou T) | Tarde |
| Nota | de 0,0 a 10,0 | 7,8 |
| Acertos | questões com pontuação cheia | 13 de 20 |
| Detalhe | prova, pontos de cada questão e hora | Cardiovascular · 1:0,5 2:0,5 3:0,33 … |

O campo **Detalhe começa com o nome da prova**, e é por ele que se separa o
cardiovascular das outras provas na mesma planilha. A coluna **Turma** separa
as salas.

### Um e-mail por dia, com as notas na planilha

O Planilhas faz isso sozinho, sem script nenhum:

1. Abra a planilha de respostas do formulário.
2. Menu **Ferramentas → Regras de notificação**.
3. Marque **Um usuário enviar um formulário** e, logo abaixo,
   **E-mail — resumo diário**.
4. Salvar.

Pronto: chega **um e-mail só por dia** avisando que houve provas novas, e o
link dentro dele abre a planilha com as notas. Se marcar "E-mail —
imediatamente", volta a ser um aviso por aluno.

### Deixando a planilha organizada por turma

Na planilha de respostas, crie uma aba para cada sala e cole **uma fórmula só**,
trocando o `801M` pelo nome da turma. Ela se atualiza sozinha a cada prova nova:

```
=QUERY('Respostas ao formulário 1'!A:F; "select B, E, F where C = '801M' and F starts with 'Cardiovascular' order by B"; 1)
```

Isso lista, em ordem alfabética, o nome, a nota e o detalhe de quem fez a prova
naquela turma. Para uma aba de **Resumo**, com a média de cada turma:

```
=QUERY('Respostas ao formulário 1'!A:F; "select C, count(E), avg(E), max(E), min(E) where F starts with 'Cardiovascular' group by C"; 1)
```

Duas observações sobre essas fórmulas:

- O nome `Respostas ao formulário 1` precisa ser igual ao da aba onde o
  formulário despeja as respostas. Se a sua tiver outro nome, troque.
- As letras são as colunas: A é o carimbo de data/hora, B o nome, C a turma,
  D o turno, E a nota, F o detalhe. Se a ordem das perguntas do seu formulário
  for outra, ajuste as letras.
- Se a média sair vazia, a planilha não está no local Brasil: em
  **Arquivo → Configurações → Local**, escolha *Brasil*, para que `7,8` seja
  lido como número.

### O que esperar, com honestidade

- **Precisa de internet na hora da entrega.** Se faltar, a nota fica guardada
  no próprio aparelho e é enviada sozinha quando a conexão voltar — inclusive
  se o aluno fechar e reabrir a prova. O aviso na tela diz qual é o caso, e há
  um botão para forçar a tentativa.
- **A prova não recebe confirmação de volta.** O navegador não deixa uma página
  ler a resposta do Google (é o preço de enviar direto, sem servidor). Ela sabe
  que a nota saiu do aparelho, não que chegou na planilha. Por isso a tela da
  nota continua servindo de comprovante — peça que o aluno mostre antes de sair.
- **Isto roda no aparelho do aluno.** Quem entender de navegador consegue forjar
  a nota. Para prova em sala, com você presente, costuma bastar.
- Para desligar o envio, troque `ativo: true` por `false` no `index.html`.

### Alternativa: planilha própria, montada sozinha

Se um dia quiser uma planilha só desta prova, que se organize em abas por turma
sem fórmula nenhuma e mande e-mail com a nota no assunto, o arquivo
[`apps-script/Codigo.gs`](apps-script/Codigo.gs) faz isso. É mais trabalhoso de
instalar (pede Apps Script e implantação) e está lá como opção, não como
caminho recomendado.

## Privacidade

Nada é coletado além do que o aluno digita: nome, sala e as respostas. Enquanto
ele não entrega, tudo fica apenas no aparelho dele.

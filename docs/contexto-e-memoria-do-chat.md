# Contexto e Memória do Chat — Como Funciona

> Documento de referência sobre como o Chess AI Assistant lida com o contexto
> da conversa e o que existe (ou não) de "memória" no chatbot.
>
> Última atualização: 2026-06-06.

Existem **dois sentidos** de "memória" que costumam ser confundidos. Um existe
neste projeto; o outro não.

---

## 1. Memória de conversa (o LLM lembra do que já foi dito) — ✅ existe, só na sessão

A cada mensagem enviada, o **frontend manda todo o histórico da conversa** junto
no corpo da requisição. Não é o servidor que "lembra" — é o cliente que reenvia
o contexto inteiro a cada turno.

**Frontend** — [`useChat.ts`](../frontend/src/hooks/useChat.ts):

```ts
const history = messagesRef.current   // todas as trocas até agora (menos a nova)
await sendChat({ message, fen, analysis, history, language, mode })
```

**Backend** — [`chat.py` › `_build_messages`](../backend/app/routers/chat.py)
remonta a lista de mensagens no formato do LLM:

```
[system] + [greeting, user q1, assistant a1, ...] + [contexto + pergunta atual]
```

O `system` é escolhido conforme o **modo** (quick / full / socratic) em
[`prompts.py`](../backend/app/services/llm/prompts.py).

➡️ **Resultado:** dentro da mesma sessão, o coach lembra do que foi conversado.
É uma memória de **curto prazo**, que vive apenas no estado React
([`useChat`](../frontend/src/hooks/useChat.ts), via `useState`).

---

## 2. Persistência (sobreviver a reload / fechar o navegador) — ❌ não existe

- As mensagens do chat **não** são salvas em `localStorage` nem em banco de
  dados. Ao recarregar a página (**F5 / Ctrl+R**), o chat **zera** e volta
  apenas com a mensagem de saudação.
- O **backend é stateless**: cada `POST /api/chat` é independente. O servidor
  **não guarda** nenhuma conversa (o MVP foi projetado sem banco de dados).
  Todo o contexto vem do frontend a cada requisição
  (`fen`, `analysis`, `history`, `mode`, `language`).
- O que **é** persistido em `localStorage` hoje:
  - o **modo** de coach (`llmMode`) — ver [`App.tsx`](../frontend/src/App.tsx);
  - o **idioma** (`chess-ai-language`) — ver [`i18n/index.ts`](../frontend/src/i18n/index.ts).
  - As **mensagens não** são persistidas.

---

## 3. Memória de longo prazo (perfil do jogador, partidas passadas, RAG) — ❌ não existe

Não há embeddings, histórico entre sessões, nem qualquer noção de "o que esse
usuário costuma errar". Não estava no escopo do projeto.

---

## ⚠️ Pontos de atenção

### a) O histórico cresce sem limite
Como **todas** as mensagens são reenviadas a cada turno, uma conversa longa
aumenta os tokens enviados — o que eleva custo e latência e pode **esbarrar no
limite de contexto/cota** do provedor. No **Gemini free tier** (limites
apertados) isso é especialmente relevante. Hoje **não há** truncamento nem
janela deslizante.

### b) O contexto posicional das mensagens antigas se perde
O `fen`/`analysis` só é anexado à **pergunta atual**
([`chat.py`](../backend/app/routers/chat.py)). As mensagens antigas no histórico
carregam só o **texto** — não a posição da época. Então, se você jogou vários
lances e pergunta "e agora?", o LLM vê toda a conversa em texto, mas só
"enxerga" o tabuleiro **atual**. Isso pode gerar confusão quando a conversa
referencia posições passadas.

---

## Melhorias possíveis (não implementadas)

| Melhoria | O que resolve | Esforço |
|---|---|---|
| Persistir chat no `localStorage` | Sobrevive a reload (por sessão de jogo) | Baixo |
| Limitar histórico (últimas N mensagens) | Evita estourar tokens/cota do Gemini | Baixo |
| Anexar FEN a cada turno do histórico | LLM entende a que posição cada pergunta se referia | Médio |
| Backend com sessão + SQLite | Memória real server-side, base para multiusuário | Alto |

**Recomendação:** começar pelos dois de **baixo esforço** (persistir no
`localStorage` + limitar o histórico a ~12–16 mensagens), que dão o maior ganho
prático com o menor risco — especialmente útil no free tier do Gemini.

---

## Resumo rápido

| Pergunta | Resposta |
|---|---|
| O coach lembra da conversa atual? | ✅ Sim (frontend reenvia o histórico a cada turno) |
| Sobrevive a um reload da página? | ❌ Não (estado só em memória do React) |
| O servidor guarda as conversas? | ❌ Não (backend stateless, sem banco) |
| Tem memória de longo prazo / perfil? | ❌ Não |
| O histórico tem limite de tamanho? | ❌ Não (cresce indefinidamente) |
| O que persiste entre sessões? | Apenas modo do coach e idioma (`localStorage`) |

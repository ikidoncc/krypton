# GEMINI.md — Contexto Crítico do Projeto Krypton

> Este arquivo deve ser lido **antes de qualquer alteração** no projeto.

---

## O que é o Krypton?

Krypton é um jogo multiplayer de dedução por palavras (inspirado em Codenames) onde dois times competem usando pistas para identificar palavras secretas. O MVP valida a experiência multiplayer P2P com WebRTC, sem servidor dedicado.

---

## Stack Tecnológica

| Camada        | Tecnologia                |
|---------------|---------------------------|
| Frontend      | React + TypeScript + Vite |
| UI            | Tailwind CSS + shadcn/ui  |
| Estado        | Zustand                   |
| Comunicação   | WebRTC (PeerJS no dev)    |
| Sinalização   | PeerJS Cloud (dev) / Cloudflare Worker (futuro) |
| Hospedagem    | Cloudflare Pages          |

---

## Estrutura do Monorepo

```
apps/
  web/          ← Aplicação React (frontend)

packages/
  engine/       ← Lógica pura do jogo (sem UI, sem rede)
  network/      ← WebRTC, mensagens, sincronização
  shared/       ← Tipos TypeScript compartilhados entre todos os pacotes
```

> **Regra crítica:** `engine` e `shared` são **zero-dependency** em relação à UI e à rede. Nunca importe React ou PeerJS dentro desses pacotes.

---

## Arquitetura: Host-Authoritative P2P

```
Host (navegador)
  └─ Estado Oficial do Jogo
       └─ WebRTC (broadcast)
            └─ Clientes (apenas enviam intenções)
```

- O **Host** é o único que valida jogadas, gera o tabuleiro e sincroniza o estado.
- Os **clientes** apenas enviam mensagens de intenção (`REVEAL_CARD`, `CLUE`, etc.).
- Nunca mova lógica de validação para o cliente — isso quebra a integridade do jogo.

---

## Tipos Centrais (packages/shared)

Os tipos abaixo são a fonte de verdade. Qualquer alteração deve ser propagada para todos os pacotes:

- `Player` — jogador com id, nome, time, papel
- `Team` — `red | blue | spectator`
- `Role` — `spymaster | operative`
- `Card` — palavra, cor, se foi revelada
- `Board` — grid 5×5 de `Card`
- `GameState` — estado completo da partida
- `Message` — envelope das mensagens WebRTC

---

## Mensagens WebRTC

Todas as mensagens são serializadas em JSON. Tipos previstos:

```
CREATE_ROOM | JOIN_ROOM | START_GAME | CLUE | REVEAL_CARD | NEXT_TURN | SYNC_STATE | PLAYER_JOINED | PLAYER_LEFT | GAME_OVER
```

> **Importante:** Sempre use o tipo `Message` de `packages/shared` para tipar payloads. Nunca envie strings cruas sem tipagem.

---

## Regras do Jogo (engine)

- Tabuleiro: **25 cartas**, grid **5×5**
- Distribuição padrão: 9 cartas do time que começa, 8 do outro, 7 neutras, 1 assassino
- O time que revelar **todas as suas cartas** vence
- Se o **assassino** for revelado, aquele time perde imediatamente
- Apenas o **Mestre (Spymaster)** recebe o mapa secreto (cores + assassino)
- O Host **nunca envia o mapa secreto** para clientes que não são Mestres

---

## Fluxo da Partida

```
Lobby → Escolha de times/papéis → Host inicia → Geração do tabuleiro
→ Sincronização → Turno do Mestre (dica) → Operativos adivinham
→ Validação pelo Host → Próximo turno → ... → Fim de jogo
```

---

## O que NÃO está no MVP

Não implemente estas funcionalidades — elas são pós-MVP:

- Login / perfil / avatar
- Histórico de partidas e estatísticas
- Matchmaking público
- Chat in-game
- Temas claro/escuro/personalizados
- Pacotes de palavras por categoria/idioma
- Reconexão após queda
- Transferência de Host

---

## Convenções de Código

- TypeScript estrito (`strict: true` no tsconfig)
- Sem `any` — use tipos explícitos ou `unknown` com type guards
- Componentes React: PascalCase, um componente por arquivo
- Hooks customizados: prefixo `use` (ex: `useGameState`, `usePeer`)
- Mensagens WebRTC: sempre tipadas com discriminated unions (`type` como literal)
- Testes unitários na `engine` são prioritários — ela é pura e fácil de testar

---

## Critérios de Sucesso do MVP

O MVP está completo quando for possível:

1. Criar uma sala e receber um código de convite
2. Conectar pelo menos 4 jogadores via código
3. Iniciar uma partida do zero
4. Jogar uma partida completa (dicas → adivinhas → vitória/derrota)
5. Todas as jogadas sincronizadas em tempo real
6. Sem necessidade de servidor dedicado (apenas PeerJS Cloud para sinalização)

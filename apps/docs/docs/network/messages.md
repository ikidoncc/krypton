# Protocolo de Mensagens WebRTC

## 1. Objetivo
Mapear e documentar todas as estruturas de mensagens JSON trocadas entre Host e clientes através dos canais de dados WebRTC.

---

## 2. Conceitos
* **Discriminated Union**: Padrão TypeScript onde cada mensagem possui um campo literal `type` que atua como discriminante, facilitando o type-narrowing automático no parser.
* **Envelope de Mensagem**: Estrutura contendo o tipo da mensagem (`type`), o payload correspondente (`payload`) e a origem do remetente (`from`).

---

## 3. Funcionamento
Todas as conexões WebRTC são serializadas e desserializadas como JSON de forma transparente pela biblioteca PeerJS. As mensagens seguem a tabela estrutural abaixo.

---

## 4. Tabela de Mensagens e Payloads

| Nome da Mensagem (`type`) | Enviado Por | Payload | Descrição |
|---|---|---|---|
| **`JOIN_ROOM`** | Cliente → Host | `{ name: string }` | Envia o apelido do cliente ao Host logo após conectar para se registrar. |
| **`PLAYER_JOINED`** | Host → Clientes | `{ player: Player, players: Player[] }` | Notifica todos os clientes de que um novo jogador entrou na sala. |
| **`PLAYER_LEFT`** | Host → Clientes | `{ id: string }` | Notifica os clientes sobre a desconexão ou saída de um jogador. |
| **`UPDATE_PLAYER`** | Cliente → Host | `{ team: Team, role: Role \| null }` | Solicita alteração de time ou papel no lobby/teams. |
| **`START_GAME`** | Cliente(Host) → Host | `{}` | Intenção do Host de iniciar a partida lúdica. |
| **`SYNC_STATE`** | Host → Clientes | `GameState` (Mascarado) | Atualiza os clientes com o estado de jogo atualizado e validado pelo Host. |
| **`CLUE`** | Cliente(Mestre) → Host | `{ word: string, count: number }` | Envia a pista fornecida pelo Mestre no turno de dar dicas. |
| **`REVEAL_CARD`** | Cliente(Operativo) → Host | `{ cardId: number }` | Solicita a revelação de uma carta específica durante o turno de adivinhar. |
| **`NEXT_TURN`** | Cliente(Operativo) → Host | `{}` | Solicita encerramento voluntário do turno de adivinhações do time. |
| **`GAME_OVER`** | Host → Clientes | `{ winner: Team, reason: 'cards' \| 'assassin' }` | Notifica o fim oficial da partida (usado em conjunto com o `SYNC_STATE`). |

---

## 5. Exemplos

### Tipo TypeScript da Mensagem (shared/src/messages.ts)
```typescript
export type Message =
  | { type: 'JOIN_ROOM'; payload: { name: string }; from: string }
  | { type: 'PLAYER_JOINED'; payload: { player: Player; players: Player[] }; from: string }
  | { type: 'PLAYER_LEFT'; payload: { id: string }; from: string }
  | { type: 'UPDATE_PLAYER'; payload: { team: Team; role: Role | null }; from: string }
  | { type: 'START_GAME'; payload: Record<string, never>; from: string }
  | { type: 'SYNC_STATE'; payload: GameState; from: string }
  | { type: 'CLUE'; payload: { word: string; count: number }; from: string }
  | { type: 'REVEAL_CARD'; payload: { cardId: number }; from: string }
  | { type: 'NEXT_TURN'; payload: Record<string, never>; from: string }
  | { type: 'GAME_OVER'; payload: { winner: Team; reason: 'cards' | 'assassin' }; from: string };
```

---

## 6. Referências
* [Modelo de Mensagens no shared/src/messages.ts](file:///home/ikidon/github/krypton/packages/shared/src/messages.ts)

# Custom Hooks

## 1. Objetivo
Documentar a API e os parâmetros de retorno do hook customizado `useNetwork`, responsável por conectar a interface do usuário às ações de rede (WebRTC) e atualizar o estado compartilhado.

---

## 2. Conceitos
* **Custom Hooks**: Abstração do React para reutilizar lógica com estado de ciclo de vida.
* **Unified Network Interface**: O hook abstrai se o jogador local é o Host ou um Cliente. A chamada para realizar ações (como `revealCard` ou `giveClue`) resolve internamente se envia via WebRTC (cliente) ou se calcula localmente no reducer (host).

---

## 3. Funcionamento
O `useNetwork` lê referências aos gerenciadores `HostManager` e `ClientManager` das stores Zustand e expõe as seguintes funções de transição lúdica:
* `createRoom(name)`: Cria uma sala, atuando como Host.
* `joinRoom(name, code)`: Entra em uma sala existente via código, atuando como Cliente.
* `updatePlayer(team, role)`: Solicita mudança de equipe e papel.
* `startGame()`: Inicia o jogo lúdico.
* `giveClue(word, count)`: Fornece pista (apenas Mestres).
* `revealCard(cardId)`: Revela uma carta (apenas Operativos).
* `endTurn()`: Encerra o turno de adivinhações voluntariamente.
* `leaveRoom()`: Limpa conexões, reinicia stores e retorna à tela inicial.

---

## 4. Diagrama de Roteamento de Ação (useNetwork)

```mermaid
graph TD
    UI[Ação do Usuário: Clique em Revelar Carta] -->|Chama| Hook[useNetwork.revealCard]
    Hook -->|Checa Role| Cond{É o Host?}
    Cond -->|Sim (Host)| Local[HostManager.dispatch localmente]
    Cond -->|Não (Cliente)| Network[ClientManager.sendRevealCard via WebRTC]
```

---

## 5. Exemplos

### Utilização do Hook na Interface
```typescript
import { useNetwork } from '@/hooks/useNetwork';

export function GameBoard() {
  const { revealCard, endTurn } = useNetwork();

  return (
    <div>
      <button type="button" onClick={() => revealCard(5)}>
        Revelar Carta 5
      </button>
      <button type="button" onClick={endTurn}>
        Encerrar Turno
      </button>
    </div>
  );
}
```

---

## 6. Referências
* [Código Fonte do useNetwork](file:///home/ikidon/github/krypton/apps/web/src/hooks/useNetwork.ts)

# Ciclo de Turnos e Validações

## 1. Objetivo
Descrever o fluxo lógico de transição de turnos e as regras aplicadas pelo motor do jogo sobre adivinhações e pistas.

---

## 2. Conceitos
* **Giving Clue**: Fase em que apenas o Mestre do time ativo pode enviar uma palavra-chave e um número.
* **Guessing**: Fase em que os Operativos do time ativo clicam nas cartas do tabuleiro.
* **Guesses Left**: Contador de palpites restantes (definido como número de pistas + 1 para a jogada bônus, ou `Infinity` caso a dica tenha quantidade zero).

---

## 3. Funcionamento
A transição de turnos e validações ocorre da seguinte forma:

```mermaid
graph TD
    A[Início do Turno] -->|Mestre ativo dá dica| B[turnPhase = guessing]
    B -->|Operativo clica em carta correta| C{Acabaram os palpites?}
    C -- Sim -->|Troca de Time & turnPhase = giving_clue| A
    C -- Não -->|Pode continuar adivinhando ou clicar em Encerrar| B
    B -->|Operativo clica em carta neutra/inimiga| D[Troca de Time & turnPhase = giving_clue]
    D --> A
    B -->|Clica no botão Encerrar Turno| D
```

### Regras de Palpites
1. **Pista com quantidade > 0**: O número máximo de tentativas é $N + 1$. O palpite extra (+1) serve para tentar identificar pistas passadas que não foram adivinhadas.
2. **Pista com quantidade = 0**: Representa tentativas ilimitadas. O contador interno é ajustado para `Infinity`.

---

## 4. Exemplos

### Validação de Revelação de Carta (validators.ts)
```typescript
export function canRevealCard(state: GameState, player: Player, cardId: number): boolean {
  if (state.phase !== 'playing') return false;
  if (state.turnPhase !== 'guessing') return false;
  if (player.team !== state.currentTeam) return false;
  if (player.role !== 'operative') return false;
  if (state.guessesLeft <= 0) return false;

  const card = state.board[cardId];
  if (card === undefined || card.revealed) return false;

  return true;
}
```

---

## 6. Referências
* [Módulo de Validações de Jogo](file:///home/ikidon/github/krypton/packages/engine/src/validators.ts)
* [Regulamento Oficial do jogo Codenames](https://czechgames.com/files/rules/codenames-rules-en.pdf)

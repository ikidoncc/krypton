---
id: 0004-state-management
---

# ADR 0004: Gerenciamento de Estado Simplificado com Zustand

## 1. Contexto
Aplicações multiplayer reativas exigem sincronização veloz entre a chegada de dados pela rede WebRTC e o renderizador do React. Bibliotecas pesadas como Redux geram boilerplate excessivo e complicam o fluxo de dados em um monorepo.

---

## 2. Problema
Como manter o estado da interface visual React sincronizado com as instâncias de rede WebRTC de forma reativa e de baixíssimo overhead?

---

## 3. Solução
Adotar **Zustand** para o gerenciamento de estado global:
* Armazenamento simples e rápido do `gameState` oficial recebido da rede, do `localPlayer` e do status de conexão.
* Separação clara entre a store de dados do jogo (`useGameStore`) e a store de conexões ativas (`usePeerStore`).

---

## 4. Consequências

### Positivas
* **Complexidade Mínima**: Zustand não exige Context Providers e permite leitura/escrita simples fora dos componentes (ideal para os callbacks do `ClientManager` e `HostManager`).
* **Bundle Otimizado**: A biblioteca pesa menos de 2kB.
* **Fácil Depuração**: Atualizações unidirecionais do estado oficial replicam instantaneamente em toda a árvore.

### Negativas
* **Falta de Ferramentas Nativas de DevTools**: Diferente do Redux, o debug visual exige logs customizados ou uso integrado de devtools do Zustand.

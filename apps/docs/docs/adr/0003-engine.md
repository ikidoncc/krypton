---
id: 0003-engine
---

# ADR 0003: Motor de Jogo Puro e Testabilidade

## 1. Contexto
Desenvolver regras de jogo acopladas ao React (ex: em custom hooks ou componentes) torna a lógica extremamente difícil de testar de forma isolada, gerando bugs difíceis de rastrear na interface visual ou no sincronismo de rede.

---

## 2. Problema
Como estruturar a lógica matemática e regras de jogo (tabuleiros, turnos, condições de fim de jogo) para garantir 100% de testabilidade e conformidade?

---

## 3. Solução
Isolar todas as regras na biblioteca `@krypton/engine`:
* Criação de funções utilitárias puras e validadores sem dependências (`validators.ts`, `boardGenerator.ts`).
* Centralização de transições de estado no padrão `gameReducer(state, action)`.
* Cobertura exaustiva de testes de unidade automatizados usando **Vitest**.

---

## 4. Consequências

### Positivas
* **Confiabilidade Matemática**: Regras de jogo protegidas por 61 testes de unidade passando a cada build.
* **Segurança de Código**: Fácil legibilidade e manutenção das regras de negócio.
* **Portabilidade**: O código roda perfeitamente em Node.js ou browsers sem qualquer ajuste.

### Negativas
* **Indireção**: A interface visual precisa despachar ações ao reducer através da camada de rede, adicionando um nível extra de abstração no fluxo de dados.

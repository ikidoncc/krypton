---
id: 0001-project-structure
---

# ADR 0001: Estrutura do Monorepo

## 1. Contexto
O projeto Krypton engloba múltiplos domínios lógicos que mudam em velocidades diferentes: a interface do jogo (React SPA), a documentação, a rede WebRTC e as regras do jogo. Manter tudo em repositórios separados geraria lentidão no linking de pacotes, enquanto colocar tudo acoplado no mesmo diretório causaria vazamento de responsabilidades e impossibilitaria reuso futuro.

---

## 2. Problema
Como organizar a base de código do projeto Krypton para facilitar o desenvolvimento integrado local, garantir encapsulamento rigoroso e permitir compilação e deploy estático independente?

---

## 3. Solução
Implementar um **Monorepo** estruturado sob o gerenciador **pnpm Workspaces**:
* Divisão em `apps/` para aplicações prontas para deploy (`web` e `docs`).
* Divisão em `packages/` para bibliotecas reutilizáveis locais (`shared`, `engine`, `network`).
* Uso de dependências cruzadas via symlinks automáticos do pnpm (`"workspace:*"`).

---

## 4. Consequências

### Positivas
* **Links Instantâneos**: Alterações feitas em `engine` ou `network` refletem na UI do frontend React (`web`) imediatamente.
* **Isolamento de Erros**: O motor de jogo (`engine`) é 100% puro e testado de forma isolada, livre de bugs de rede ou do ciclo de renderização do React.
* **Deploys Autônomos**: Cada aplicativo em `apps/` pode ser implantado independentemente na Cloudflare Pages.

### Negativas
* **Curva de Aprendizado**: Exige familiaridade com comandos de workspace do pnpm (filtros como `--filter`) e gerenciamento de tsconfig references.

# Estrutura do Monorepo

## 1. Objetivo
Apresentar a organização física dos arquivos do repositório, mapeando a árvore de pastas e explicando a responsabilidade de cada diretório.

---

## 2. Conceitos
* **Monorepo**: Padrão arquitetural que reúne múltiplos projetos em um único repositório git.
* **Encapsulamento**: Separação clara de responsabilidades, garantindo que o frontend React (`web`) não polua a lógica computacional do jogo (`engine`) ou a camada de rede (`network`).

---

## 3. Funcionamento
A árvore do diretório do projeto Krypton é configurada através do `pnpm-workspace.yaml`. As dependências internas são resolvidas via symlinks e declaradas no `package.json` de cada pacote usando a sintaxe `"workspace:*"`.

---

## 4. Diagrama de Árvore do Repositório

```text
krypton/
├── apps/               # Aplicações Finais (Deployables)
│   ├── web/            # Jogo frontend React + Vite
│   └── docs/           # Este portal de documentação (Docusaurus)
├── packages/           # Bibliotecas internas e compartilhadas
│   ├── engine/         # Lógica pura do jogo, sem interface e sem rede
│   ├── network/        # WebRTC wrapper via PeerJS e Host/Client Managers
│   └── shared/         # Tipos TypeScript compartilhados e envelopes de mensagens
├── package.json        # Configuração geral da raiz e dependências globais
├── pnpm-workspace.yaml # Mapeamento dos pacotes do workspace
└── biome.json          # Configuração global de linting e formatação
```

---

## 5. Exemplos

### Referenciar um pacote interno no package.json
No `packages/network/package.json`, o pacote `engine` é declarado como uma dependência local:
```json
"dependencies": {
  "@krypton/engine": "workspace:*",
  "@krypton/shared": "workspace:*"
}
```

---

## 6. Referências
* [Estrutura de Monorepos com pnpm](https://pnpm.io/workspaces)
* [Estrutura de projetos em monorepos de larga escala](https://monorepo.tools/)

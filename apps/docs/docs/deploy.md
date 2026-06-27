# Deploy e Configuração de Infraestrutura

## 1. Objetivo
Fornecer instruções passo a passo para realizar o deploy estático independente das aplicações do monorepo (Tanto o jogo `web` quanto este portal de documentação `docs`) na nuvem do Cloudflare Pages.

---

## 2. Conceitos
* **Cloudflare Pages**: Plataforma gratuita para hospedagem de aplicações JAMstack estáticas rápidas e seguras.
* **Build independente**: O monorepo do Krypton permite fazer deploy de `apps/web` e `apps/docs` separadamente com comandos direcionados do pnpm.

---

## 3. Funcionamento do Deploy
O deploy na Cloudflare Pages monitora commits em branches do GitHub e dispara pipelines de compilação automáticos de acordo com os scripts de build especificados.

---

## 4. Configurações e Variáveis de Ambiente

### Configurações de Build na Cloudflare Pages

| Propriedade | Configuração do Jogo (`web`) | Configuração das Docs (`docs`) |
|---|---|---|
| **Build Command** | `pnpm build` | `pnpm --filter @krypton/docs build` |
| **Output Directory** | `apps/web/dist` | `apps/docs/build` |
| **Root Directory** | `/` (raiz do monorepo) | `/` (raiz do monorepo) |

### Tabela de Variáveis de Ambiente

| Variável | Valor Recomendado | Descrição |
|---|---|---|
| **`NODE_VERSION`** | `20` (ou superior) | Define a versão do runtime Node utilizada pela Cloudflare para instalar dependências e rodar o compilador. |

---

## 5. Exemplos

### Execução de compilação manual (CLI)
Para gerar a build de produção estática local das docs:
```bash
pnpm --filter @krypton/docs build
```
O diretório compilado estará disponível em `apps/docs/build/`.

---

## 6. Referências
* [Docusaurus Deploy Guidelines](https://docusaurus.io/docs/deployment)
* [Cloudflare Pages Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)

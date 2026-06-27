# Guia de Deploy e Configuração — Krypton MVP

Este documento explica como rodar, testar, compilar e implantar o projeto **Krypton** no ambiente de produção.

---

## 🚀 Desenvolvimento Local

Antes de fazer o deploy, certifique-se de que o projeto funciona localmente.

### Pré-requisitos
* **Node.js**: v20 ou superior (Node v24 recomendado)
* **pnpm**: v9 ou superior (pnpm v10 recomendado)

### Passos para Rodar Localmente

1. **Instalar Dependências**:
   Instale as dependências de todo o monorepo a partir da raiz:
   ```bash
   pnpm install
   ```

2. **Rodar em Modo de Desenvolvimento**:
   Suba o servidor local do frontend (Vite) com resolução dos pacotes internos em tempo real:
   ```bash
   pnpm dev
   ```
   A aplicação estará rodando em [http://localhost:5173/](http://localhost:5173/).

3. **Rodar Testes**:
   Execute os testes da engine de jogo para validar as regras:
   ```bash
   pnpm test
   ```

4. **Validar Tipos (TypeScript Check)**:
   Antes de commitar ou fazer deploy, garanta que não há erros de tipagem no monorepo:
   ```bash
   pnpm typecheck
   ```

---

## 📦 Compilação para Produção

Para gerar os arquivos estáticos prontos para distribuição:

### 1. Compilar apenas o Jogo (web)
```bash
pnpm build
```
O comando irá:
1. Compilar os tipos dos pacotes internos (`packages/shared`, `packages/engine`, `packages/network`).
2. Gerar o bundle otimizado da aplicação React em `apps/web/dist/`.

### 2. Compilar apenas a Documentação (docs)
```bash
pnpm docs:build
```
O comando irá compilar os arquivos estáticos e gerar o indexador de busca local em `apps/docs/build/`.

### 3. Compilar Todo o Workspace
Você também pode compilar tanto o jogo quanto a documentação executando o build global a partir do workspace:
```bash
pnpm --recursive build
```

---

## ☁️ Deploy na Cloudflare Pages

O Krypton foi arquitetado para ter deploys independentes das suas aplicações (`web` e `docs`) hospedados gratuitamente na **Cloudflare Pages**. Há duas formas de deploy para cada um:

---

### Opção 1: Integração Automática via Git (Recomendado)

Se o seu repositório estiver no GitHub ou GitLab:

#### A. Deploy do Jogo (`apps/web`)
1. Acesse o **Painel da Cloudflare** e vá em **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Selecione o repositório `krypton`.
3. Defina as seguintes **Build Settings**:
   * **Framework preset**: `None`
   * **Build command**: `pnpm build`
   * **Build output directory**: `apps/web/dist`
   * **Root directory**: `/` (raiz do repositório)
4. Em **Environment variables** (Variáveis de Ambiente), adicione:
   * `NODE_VERSION` = `20`
5. Clique em **Save and Deploy**.

#### B. Deploy da Documentação (`apps/docs`)
1. Acesse o **Painel da Cloudflare** e vá em **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Selecione o repositório `krypton`.
3. Defina as seguintes **Build Settings**:
   * **Framework preset**: `None`
   * **Build command**: `pnpm docs:build`
   * **Build output directory**: `apps/docs/build`
   * **Root directory**: `/` (raiz do repositório)
4. Em **Environment variables** (Variáveis de Ambiente), adicione:
   * `NODE_VERSION` = `20`
5. Clique em **Save and Deploy**.

---

### Opção 2: Deploy Manual via Wrangler CLI

Caso queira subir os arquivos compilados localmente:

1. Instale o Wrangler (CLI da Cloudflare):
   ```bash
   pnpm add -g wrangler
   ```
2. Autentique-se com sua conta Cloudflare:
   ```bash
   wrangler login
   ```
3. Compile a aplicação desejada:
   ```bash
   # Para o jogo:
   pnpm build
   
   # Para a documentação:
   pnpm docs:build
   ```
4. Publique as respectivas pastas de distribuição:
   ```bash
   # Deploy do jogo
   wrangler pages deploy apps/web/dist --project-name=krypton-game
   
   # Deploy da documentação
   wrangler pages deploy apps/docs/build --project-name=krypton-docs
   ```

---

## ⚡ Configuração da Sinalização WebRTC (PeerJS)

O Krypton P2P necessita de um servidor de sinalização para conectar os navegadores dos jogadores (troca de metadados SDP e ICE candidates).

### 1. Servidor Padrão (Desenvolvimento)
Atualmente, o projeto utiliza a nuvem pública gratuita do **PeerJS Cloud** (configurado em `packages/network/src/peer.ts`).
* **Prós**: Zero configuração, funciona imediatamente fora da caixa.
* **Contras**: Limite de taxa de requisições, latência variável e sem garantia de uptime.

### 2. Migração para Infraestrutura Própria (Recomendado para Produção)
Para um ambiente de produção estável, você deve implantar seu próprio servidor de sinalização.

#### Alternativa A: Deploy de um PeerServer no Heroku, Render ou VPS
Você pode rodar a imagem oficial do [PeerServer](https://github.com/peers/peerjs-server):
```bash
npm install -g peer
peerjs --port 9000 --key peerjs-krypton --path /myapp
```
E atualizar `packages/network/src/peer.ts`:
```typescript
const PRODUCTION_CONFIG: PeerOptions = {
  host: 'seu-app-de-sinalizacao.render.com',
  port: 443,
  secure: true,
  path: '/myapp',
  key: 'peerjs-krypton',
  debug: 1
};
```

#### Alternativa B: Cloudflare Workers (Futuro)
Substituir o wrapper do PeerJS por sinalização via WebSockets no Cloudflare Workers + Durable Objects para manter o lobby das conexões. (Recomendado para manter custos em $0 e latência mínima global).

---

## 🔍 Resolução de Problemas Comuns (Troubleshooting)

### Erros de Conexão WebRTC (Não conecta ou fica preso no "Entrando...")
1. **Redes Corporativas / Simétricas**: Algumas conexões de internet (especialmente Wi-Fi corporativo, 3G/4G/5G ou redes com NAT simétrico) bloqueiam conexões P2P diretas. Para resolver, é necessário configurar servidores **STUN/TURN** em `peer.ts`.
   * Você pode usar servidores STUN públicos gratuitos da Google (`stun:stun.l.google.com:19302`).
   * Para TURN (necessário se ambos os jogadores estiverem em redes restritivas), recomenda-se serviços como Xirsys ou Metered.ca.
2. **Uso de IDs idênticos**: Se o Host fechar a aba abruptamente, o PeerJS Cloud pode demorar alguns segundos para liberar o ID de sala `krypton-{CODE}`. Se tentar recriar imediatamente, receberá erro de ID indisponível (a camada de rede do monorepo trata isso e tenta gerar outro código automaticamente).

### Erros no deploy da Cloudflare Pages
* Certifique-se de que a versão de compatibilidade de Node na Cloudflare esteja definida para v20+ em **Settings** -> **Build & Deploy** -> **Environment variables** -> `NODE_VERSION = 20`.

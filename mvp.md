# Krypton - MVP

## Visão Geral

**Krypton** é um jogo multiplayer inspirado em jogos de dedução por palavras, onde dois times competem utilizando pistas para identificar palavras secretas.

O objetivo do MVP é validar a experiência multiplayer, a arquitetura P2P e a mecânica principal do jogo, sem depender de um servidor dedicado.

---

# Objetivos do MVP

* Permitir que jogadores criem uma sala.
* Permitir que outros jogadores entrem utilizando um código.
* Sincronizar toda a partida via WebRTC.
* Executar uma partida completa do início ao fim.
* Não depender de backend para armazenar o estado do jogo.

---

# Tecnologias

## Frontend

* React
* TypeScript
* Vite

## Interface

* Tailwind CSS
* shadcn/ui

## Estado

* Zustand

## Comunicação

* WebRTC

## Sinalização

* Cloudflare Worker (futuro)
* PeerJS Cloud (desenvolvimento)

## Hospedagem

* Cloudflare Pages

---

# Arquitetura

```
Host

↓

Estado Oficial

↓

WebRTC

↓

Clientes
```

O navegador do Host será responsável por:

* gerar o tabuleiro;
* gerar as equipes;
* gerar o mapa secreto;
* validar jogadas;
* sincronizar o estado.

Os clientes apenas enviam intenções de jogada.

---

# Funcionalidades do MVP

## Lobby

* Criar sala
* Entrar utilizando código
* Lista de jogadores
* Escolher nome
* Indicar Host

---

## Equipes

* Time Vermelho
* Time Azul

Cada jogador poderá escolher:

* Vermelho
* Azul
* Espectador

---

## Papéis

Cada equipe possui:

* Mestre
* Operativos

O Host poderá alterar os papéis.

---

## Partida

Ao iniciar:

* gerar 25 palavras
* gerar mapa secreto
* definir equipe inicial

---

## Tabuleiro

* Grid 5x5
* Palavra em cada carta
* Carta revelada muda de aparência

---

## Mestre

O mestre poderá visualizar:

* cores das cartas
* assassino
* cartas neutras

Os demais jogadores não receberão essas informações.

---

## Turnos

Fluxo:

1. Mestre envia dica
2. Operativos escolhem carta
3. Host valida
4. Estado sincronizado
5. Próximo turno

---

## Vitória

Fim da partida quando:

* um time revelar todas as suas cartas;
* assassino for revelado.

---

# Comunicação

Mensagens previstas:

```
CREATE_ROOM

JOIN_ROOM

START_GAME

CLUE

REVEAL_CARD

NEXT_TURN

SYNC_STATE

PLAYER_JOINED

PLAYER_LEFT

GAME_OVER
```

Todas serão serializadas em JSON.

---

# Estrutura inicial do projeto

```
apps/
    web/

packages/
    engine/
    network/
    shared/
```

---

# Engine

A engine será completamente independente da interface.

Responsabilidades:

* regras
* geração do tabuleiro
* geração das equipes
* validação
* pontuação
* troca de turno

A interface apenas renderiza o estado.

---

# Network

Responsável por:

* conexão WebRTC
* envio de mensagens
* recebimento
* sincronização
* reconexão futura

---

# Shared

Tipos compartilhados.

Exemplos:

* Player
* Team
* Card
* Board
* GameState
* Message

---

# Fluxo de criação da partida

```
Host abre o jogo

↓

Criar Sala

↓

Código gerado

↓

Jogadores entram

↓

Host inicia partida

↓

Tabuleiro gerado

↓

Estado sincronizado

↓

Jogo começa
```

---

# Fora do MVP

Estas funcionalidades ficam para versões futuras.

## Conta de usuário

* Login
* Perfil
* Avatar

---

## Histórico

* Partidas anteriores
* Estatísticas

---

## Matchmaking

* Sala pública
* Busca automática

---

## Chat

* Chat durante a partida
* Emojis

---

## Temas

* Claro
* Escuro
* Personalizados

---

## Pacotes de palavras

* Categorias
* Idiomas
* Personalizados

---

## Reconexão

Permitir que um jogador volte à partida após perder a conexão.

---

## Transferência de Host

Caso o Host saia da partida, outro jogador assume automaticamente.

---

# Critérios de sucesso do MVP

O MVP será considerado concluído quando for possível:

* criar uma sala;
* conectar pelo menos quatro jogadores;
* iniciar uma partida;
* jogar até o final;
* sincronizar todas as jogadas em tempo real;
* finalizar sem necessidade de servidor dedicado.

---

# Objetivo Final

Criar uma plataforma multiplayer baseada em comunicação P2P, com arquitetura preparada para futuramente suportar versões Desktop e Mobile utilizando a mesma engine de jogo.


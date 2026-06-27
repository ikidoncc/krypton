---
id: 0002-webrtc
---

# ADR 0002: Comunicação P2P via WebRTC

## 1. Contexto
Jogos multiplayer tradicionais exigem um backend centralizado e bancos de dados para gerenciar conexões WebSocket ou servidores dedicados. No entanto, para um jogo casual baseado em turnos como Krypton, manter servidores dedicados gera custos de manutenção e complexidade desnecessários no MVP.

---

## 2. Problema
Como oferecer uma experiência multiplayer síncrona estável com custo de infraestrutura zero e latência de rede mínima?

---

## 3. Solução
Adotar **WebRTC P2P (Peer-to-Peer)** utilizando a biblioteca **PeerJS** como wrapper de conectividade:
* O tráfego de dados lúdicos trafega de forma direta entre navegadores sem servidores no caminho.
* Uso de um servidor de sinalização mínimo (`PeerJS Cloud`) apenas para estabelecimento de conexão e identificação por códigos legíveis de 6 caracteres.

---

## 4. Consequências

### Positivas
* **Custo Zero**: Sem servidores de jogo, sem custos de VPS ou bancos de dados em nuvem.
* **Baixa Latência**: A transmissão direta pelo canal de dados do WebRTC gera comunicação instantânea.
* **Segurança e Simplicidade**: Menos código e complexidade de segurança de conexões no backend.

### Negativas
* **NATs Restritivos**: Em redes corporativas ou 4G/5G com NAT Simétrico, conexões diretas P2P podem falhar, necessitando de servidores STUN/TURN adicionais (resolvido por configuração opcional de fallback).

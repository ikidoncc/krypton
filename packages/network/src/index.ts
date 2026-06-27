// @krypton/network — public API
//
// USAGE:
//
// HOST:
//   const { roomCode, peer } = await createRoom();
//   const host = new HostManager(peer, playerName);
//   host.on('stateChanged', (state) => updateUI(state));
//   host.dispatch({ type: 'UPDATE_PLAYER', payload: { ... } });
//
// CLIENT:
//   const { peer, hostConnection } = await joinRoom(roomCode);
//   const client = new ClientManager(peer, hostConnection, peer.id);
//   client.sendJoinRoom(playerName);
//   client.on('stateUpdated', (state) => renderGame(state));
//   client.sendRevealCard(cardId);

// ── Client ────────────────────────────────────────────────────
export { ClientManager } from './clientManager.js';
export type { EventHandler, EventMap } from './eventEmitter.js';
// ── Event emitter ─────────────────────────────────────────────
export { EventEmitter } from './eventEmitter.js';
// ── Host ──────────────────────────────────────────────────────
export { HostManager } from './hostManager.js';
export type { CreatedRoom, JoinedRoom } from './roomManager.js';
// ── Room management ───────────────────────────────────────────
export { createRoom, joinRoom } from './roomManager.js';
// ── Utilities ─────────────────────────────────────────────────
export {
  deserializeGameState,
  generateRoomCode,
  parseMessage,
  peerIdToRoomCode,
  roomCodeToPeerId,
  serializeGameState,
  serializeMessage,
} from './utils.js';

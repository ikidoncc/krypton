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

// ── Room management ───────────────────────────────────────────
export { createRoom, joinRoom } from './roomManager.js';
export type { CreatedRoom, JoinedRoom } from './roomManager.js';

// ── Host ──────────────────────────────────────────────────────
export { HostManager } from './hostManager.js';

// ── Client ────────────────────────────────────────────────────
export { ClientManager } from './clientManager.js';

// ── Utilities ─────────────────────────────────────────────────
export {
  generateRoomCode,
  roomCodeToPeerId,
  peerIdToRoomCode,
  serializeGameState,
  deserializeGameState,
  parseMessage,
  serializeMessage,
} from './utils.js';

// ── Event emitter ─────────────────────────────────────────────
export { EventEmitter } from './eventEmitter.js';
export type { EventMap, EventHandler } from './eventEmitter.js';

// ─────────────────────────────────────────────────────────────
// Room Manager — create and join rooms
// ─────────────────────────────────────────────────────────────

import type { DataConnection } from 'peerjs';
import { createPeer } from './peer.js';
import { generateRoomCode, roomCodeToPeerId, log } from './utils.js';

// ── Create room (host flow) ───────────────────────────────────

export interface CreatedRoom {
  /** The 6-character code players use to join. */
  roomCode: string;
  /** The host's open PeerJS peer — use this to accept connections. */
  peer: Awaited<ReturnType<typeof createPeer>>;
}

/**
 * Creates a new room by opening a PeerJS peer with the room code as its ID.
 *
 * The room code becomes part of the host's peer ID (`krypton-{CODE}`),
 * so clients can connect by knowing only the 6-char code.
 *
 * @returns The room code and the open host peer.
 * @throws If the room code is already taken (peer ID conflict) or PeerJS fails.
 */
export async function createRoom(): Promise<CreatedRoom> {
  const roomCode = generateRoomCode();
  const peerId = roomCodeToPeerId(roomCode);

  log.info(`Creating room with code: ${roomCode} (peer ID: ${peerId})`);

  try {
    const peer = await createPeer(peerId);
    return { roomCode, peer };
  } catch (err) {
    // Peer ID already taken → retry with a new code
    const peerError = err as { type?: string };
    if (peerError.type === 'unavailable-id') {
      log.warn(`Room code ${roomCode} taken, retrying...`);
      return createRoom(); // tail-recursive retry
    }
    throw err;
  }
}

// ── Join room (client flow) ───────────────────────────────────

export interface JoinedRoom {
  /** The client's own open PeerJS peer. */
  peer: Awaited<ReturnType<typeof createPeer>>;
  /** The open DataConnection to the host. */
  hostConnection: DataConnection;
}

/**
 * Joins an existing room by connecting to the host's peer ID.
 *
 * @param roomCode - The 6-character code shown on the lobby screen.
 * @returns The client's peer and the open connection to the host.
 * @throws If the room doesn't exist, connection fails, or times out.
 */
export async function joinRoom(roomCode: string): Promise<JoinedRoom> {
  const hostPeerId = roomCodeToPeerId(roomCode);
  log.info(`Joining room ${roomCode} → host peer: ${hostPeerId}`);

  // Open our own peer with a random ID
  const peer = await createPeer();

  return new Promise<JoinedRoom>((resolve, reject) => {
    const conn = peer.connect(hostPeerId, {
      reliable: true,
      serialization: 'json',
    });

    const timeout = window.setTimeout(() => {
      conn.close();
      peer.destroy();
      reject(new Error(`Could not connect to room ${roomCode} (timeout)`));
    }, 15_000);

    conn.once('open', () => {
      clearTimeout(timeout);
      log.info(`Connected to host (room ${roomCode})`);
      resolve({ peer, hostConnection: conn });
    });

    conn.once('error', (err) => {
      clearTimeout(timeout);
      peer.destroy();
      reject(err);
    });
  });
}

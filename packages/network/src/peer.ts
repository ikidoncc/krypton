// ─────────────────────────────────────────────────────────────
// PeerJS peer factory
// Wraps the PeerJS Peer constructor with a Promise-based API.
// ─────────────────────────────────────────────────────────────

import type { PeerOptions, Peer as PeerType } from 'peerjs';
import { Peer } from 'peerjs';
import { log } from './utils.js';

/** PeerJS configuration for PeerJS Cloud (default / dev). */
const PEERJS_CLOUD_CONFIG: PeerOptions = {
  // Using PeerJS default cloud — no extra config needed.
  // In production, replace with a Cloudflare Worker signaling server.
  debug: 0,
};

/**
 * Creates and opens a PeerJS peer.
 *
 * @param id - Optional custom peer ID (used by the host to claim the room code).
 *             If omitted, PeerJS assigns a random ID.
 * @returns A `Promise` that resolves to an open `Peer` instance.
 * @throws If the peer cannot be opened within the timeout or an error occurs.
 */
export function createPeer(id?: string): Promise<PeerType> {
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id, PEERJS_CLOUD_CONFIG) : new Peer(PEERJS_CLOUD_CONFIG);

    const timeout = window.setTimeout(() => {
      peer.destroy();
      reject(new Error('PeerJS connection timed out after 15s'));
    }, 15_000);

    peer.once('open', (assignedId) => {
      clearTimeout(timeout);
      log.info(`Peer opened with ID: ${assignedId}`);
      resolve(peer);
    });

    peer.once('error', (err) => {
      clearTimeout(timeout);
      log.error('Peer error during open:', err);
      reject(err);
    });
  });
}

export type { PeerType as Peer };

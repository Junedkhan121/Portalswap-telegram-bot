/**
 * Wallet Management Module — Multi-Wallet with BIP-39 seed phrase support
 *
 * Session shape per userId:
 * {
 *   wallets: [
 *     {
 *       id: 0,                    // stable index
 *       name: "Wallet 1",
 *       privateKey: "0x...",
 *       address: "0x...",
 *       mnemonic: "word word ...", // null when imported by private key
 *       createdAt: <timestamp>,
 *     },
 *     ...
 *   ],
 *   activeIndex: 0,               // index into wallets[]
 *   pendingRename: null | number, // wallet id awaiting rename text
 * }
 */

import { ethers } from 'ethers';
import { getAddressInfo } from './ss58.js';

// In-memory session storage (replace with Redis/database in production)
const userSessions = new Map();

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSession(userId) {
  return userSessions.get(userId) || null;
}

function nextWalletName(session) {
  // "Wallet 1", "Wallet 2", … based on total ever created (length + 1)
  return `Wallet ${session.wallets.length + 1}`;
}

function buildWalletEntry(wallet, name, mnemonic = null) {
  return {
    id: Date.now(), // unique stable id used in callback data
    name,
    privateKey: wallet.privateKey,
    address: wallet.address,
    mnemonic: mnemonic || null,
    createdAt: Date.now(),
  };
}

// ─── Create ─────────────────────────────────────────────────────────────────

/**
 * Create a new BIP-39 wallet and add it to the user's session.
 * Automatically becomes the active wallet.
 *
 * @param {number} userId
 * @returns {{ entry, displayText, isFirst: boolean }}
 */
export function createWallet(userId) {
  // ethers.Wallet.createRandom() generates a BIP-39 mnemonic by default
  const wallet = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic?.phrase || null;

  let session = getSession(userId);
  const isFirst = !session;

  if (!session) {
    session = { wallets: [], activeIndex: 0, pendingRename: null };
  }

  const name = nextWalletName(session);
  const entry = buildWalletEntry(wallet, name, mnemonic);
  session.wallets.push(entry);
  session.activeIndex = session.wallets.length - 1;
  userSessions.set(userId, session);

  const addressInfo = getAddressInfo(wallet.address);

  const mnemonicBlock = mnemonic
    ? `📝 <b>Seed Phrase (BIP-39):</b>\n<code>${mnemonic}</code>\n\n`
    : '';

  const displayText =
    `✅ <b>${name} Created!</b>\n\n` +
    addressInfo.displayText + `\n\n` +
    mnemonicBlock +
    `🔐 <b>Private Key:</b>\n<code>${wallet.privateKey}</code>\n\n` +
    `⚠️ <b>Save all of the above securely.</b>\n` +
    `This bot does not store your keys permanently — if you lose them you cannot recover this wallet.`;

  return { entry, displayText, isFirst };
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Import a wallet by private key.
 *
 * @param {number} userId
 * @param {string} privateKey
 * @returns {{ success, entry?, displayText?, error? }}
 */
export function importWalletByKey(userId, privateKey) {
  try {
    const cleanKey = privateKey.trim().startsWith('0x')
      ? privateKey.trim()
      : '0x' + privateKey.trim();

    const wallet = new ethers.Wallet(cleanKey);

    let session = getSession(userId);
    if (!session) {
      session = { wallets: [], activeIndex: 0, pendingRename: null };
    }

    // Prevent duplicate imports
    const exists = session.wallets.find(
      (w) => w.address.toLowerCase() === wallet.address.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'This wallet is already in your list.' };
    }

    const name = nextWalletName(session);
    const entry = buildWalletEntry(wallet, name, null);
    session.wallets.push(entry);
    session.activeIndex = session.wallets.length - 1;
    userSessions.set(userId, session);

    const addressInfo = getAddressInfo(wallet.address);

    return {
      success: true,
      entry,
      displayText:
        `✅ <b>${name} imported!</b>\n\n` +
        addressInfo.displayText,
    };
  } catch {
    return { success: false, error: 'Invalid private key. Please check and try again.' };
  }
}

/**
 * Import a wallet by BIP-39 mnemonic (seed phrase).
 *
 * @param {number} userId
 * @param {string} mnemonic - 12 or 24 word phrase
 * @returns {{ success, entry?, displayText?, error? }}
 */
export function importWalletByMnemonic(userId, mnemonic) {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

    let session = getSession(userId);
    if (!session) {
      session = { wallets: [], activeIndex: 0, pendingRename: null };
    }

    const exists = session.wallets.find(
      (w) => w.address.toLowerCase() === wallet.address.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'This wallet is already in your list.' };
    }

    const name = nextWalletName(session);
    const entry = buildWalletEntry(wallet, name, mnemonic.trim());
    session.wallets.push(entry);
    session.activeIndex = session.wallets.length - 1;
    userSessions.set(userId, session);

    const addressInfo = getAddressInfo(wallet.address);

    return {
      success: true,
      entry,
      displayText:
        `✅ <b>${name} restored from seed phrase!</b>\n\n` +
        addressInfo.displayText,
    };
  } catch {
    return {
      success: false,
      error: 'Invalid seed phrase. Please check all words and try again.',
    };
  }
}

// ─── Legacy shim — kept so existing handlers still compile ──────────────────

/**
 * @deprecated Use importWalletByKey or importWalletByMnemonic instead.
 * Kept for backward compatibility with the text handler in index.js.
 */
export function importWallet(userId, input) {
  const trimmed = input.trim();
  // Detect mnemonic: contains spaces and no 0x
  if (trimmed.includes(' ') && !trimmed.startsWith('0x')) {
    return importWalletByMnemonic(userId, trimmed);
  }
  return importWalletByKey(userId, trimmed);
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Returns the active wallet entry, or null.
 */
export function getWalletSession(userId) {
  const session = getSession(userId);
  if (!session || session.wallets.length === 0) return null;
  return session.wallets[session.activeIndex] || session.wallets[0];
}

/**
 * Returns the full session object (wallets array + activeIndex).
 */
export function getFullSession(userId) {
  return getSession(userId);
}

export function hasActiveSession(userId) {
  const session = getSession(userId);
  return !!(session && session.wallets.length > 0);
}

/**
 * Returns all wallets for a user (for the switch menu).
 */
export function listWallets(userId) {
  const session = getSession(userId);
  if (!session) return [];
  return session.wallets;
}

// ─── Switch ──────────────────────────────────────────────────────────────────

/**
 * Switch the active wallet by wallet id.
 *
 * @param {number} userId
 * @param {number} walletId - entry.id
 * @returns {{ success, name? }}
 */
export function switchWallet(userId, walletId) {
  const session = getSession(userId);
  if (!session) return { success: false };
  const idx = session.wallets.findIndex((w) => w.id === walletId);
  if (idx === -1) return { success: false };
  session.activeIndex = idx;
  userSessions.set(userId, session);
  return { success: true, name: session.wallets[idx].name };
}

// ─── Rename ──────────────────────────────────────────────────────────────────

export function setPendingRename(userId, walletId) {
  const session = getSession(userId);
  if (!session) return false;
  session.pendingRename = walletId;
  userSessions.set(userId, session);
  return true;
}

export function getPendingRename(userId) {
  return getSession(userId)?.pendingRename ?? null;
}

export function clearPendingRename(userId) {
  const session = getSession(userId);
  if (!session) return;
  session.pendingRename = null;
  userSessions.set(userId, session);
}

/**
 * @param {number} userId
 * @param {number} walletId
 * @param {string} newName
 */
export function renameWallet(userId, walletId, newName) {
  const session = getSession(userId);
  if (!session) return { success: false };
  const wallet = session.wallets.find((w) => w.id === walletId);
  if (!wallet) return { success: false };
  wallet.name = newName.slice(0, 32); // cap at 32 chars
  userSessions.set(userId, session);
  return { success: true };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Delete a wallet by id.
 * If it was the active wallet, active index moves to 0 (or session cleared).
 *
 * @param {number} userId
 * @param {number} walletId
 * @returns {{ success, remaining: number }}
 */
export function deleteWallet(userId, walletId) {
  const session = getSession(userId);
  if (!session) return { success: false, remaining: 0 };

  const idx = session.wallets.findIndex((w) => w.id === walletId);
  if (idx === -1) return { success: false, remaining: session.wallets.length };

  session.wallets.splice(idx, 1);

  if (session.wallets.length === 0) {
    userSessions.delete(userId);
    return { success: true, remaining: 0 };
  }

  // Keep activeIndex in bounds
  if (session.activeIndex >= session.wallets.length) {
    session.activeIndex = session.wallets.length - 1;
  }
  userSessions.set(userId, session);
  return { success: true, remaining: session.wallets.length };
}

// ─── Clear (logout all) ──────────────────────────────────────────────────────

export function clearSession(userId) {
  userSessions.delete(userId);
}

// ─── Signer ──────────────────────────────────────────────────────────────────

export function getWalletSigner(userId, provider) {
  const active = getWalletSession(userId);
  if (!active) return null;
  return new ethers.Wallet(active.privateKey, provider);
}

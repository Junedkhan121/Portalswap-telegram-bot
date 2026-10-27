/**
 * Wallet Manager Handler
 * Multi-wallet: create, import (key / seed phrase), switch, rename, delete
 */

import {
  getWalletSession,
  getFullSession,
  listWallets,
  createWallet,
  importWalletByKey,
  importWalletByMnemonic,
  switchWallet,
  renameWallet,
  deleteWallet,
  setPendingRename,
  getPendingRename,
  clearPendingRename,
} from '../utils/wallet.js';
import { getAddressInfo } from '../utils/ss58.js';
import {
  getMainMenu,
  getInitialMenu,
  getWalletManagerMenu,
  getSwitchWalletKeyboard,
  getDeleteConfirmKeyboard,
  getImportMethodKeyboard,
  getBackButton,
} from '../keyboards/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function activeWalletSummary(userId) {
  const active = getWalletSession(userId);
  if (!active) return null;
  const info = getAddressInfo(active.address);
  return (
    `👜 <b>${active.name}</b>\n\n` +
    `EVM: <code>${active.address}</code>\n` +
    `SS58: <code>${info.ss58}</code>`
  );
}

// ─── Wallet Manager main screen ───────────────────────────────────────────────

export async function handleWalletManager(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const active = getWalletSession(ctx.from.id);
  if (!active) {
    // No wallet yet — show setup menu
    await ctx.editMessageText(
      '🔐 <b>No wallet yet.</b>\n\nCreate a new one or import an existing wallet to get started.',
      { parse_mode: 'HTML', ...getInitialMenu() }
    );
    return;
  }
  const summary = activeWalletSummary(ctx.from.id);
  try {
    await ctx.editMessageText(summary, {
      parse_mode: 'HTML',
      ...getWalletManagerMenu(active),
    });
  } catch {
    await ctx.reply(summary, { parse_mode: 'HTML', ...getWalletManagerMenu(active) });
  }
}

// ─── Switch wallet list ───────────────────────────────────────────────────────

export async function handleSwitchWalletMenu(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const session = getFullSession(ctx.from.id);
  if (!session || session.wallets.length === 0) {
    await ctx.answerCbQuery('No wallets found.', { show_alert: true });
    return;
  }
  try {
    await ctx.editMessageText(
      '🔄 <b>Switch Wallet</b>\n\nSelect the wallet you want to make active:',
      {
        parse_mode: 'HTML',
        ...getSwitchWalletKeyboard(session.wallets, session.activeIndex),
      }
    );
  } catch {
    await ctx.reply(
      '🔄 <b>Switch Wallet</b>\n\nSelect the wallet you want to make active:',
      {
        parse_mode: 'HTML',
        ...getSwitchWalletKeyboard(session.wallets, session.activeIndex),
      }
    );
  }
}

// ─── Activate a specific wallet ───────────────────────────────────────────────

// Called for callback_data matching: wallet_activate_<id>
export async function handleActivateWallet(ctx) {
  const walletId = parseInt(ctx.match[1], 10);
  const result = switchWallet(ctx.from.id, walletId);
  if (!result.success) {
    await ctx.answerCbQuery('Wallet not found.', { show_alert: true });
    return;
  }
  await ctx.answerCbQuery(`✅ Switched to ${result.name}`, { show_alert: false });
  // Refresh the manager screen
  await handleWalletManager(ctx);
}

// ─── Rename: prompt ───────────────────────────────────────────────────────────

export async function handleRenamePrompt(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const active = getWalletSession(ctx.from.id);
  if (!active) return;
  setPendingRename(ctx.from.id, active.id);
  try {
    await ctx.editMessageText(
      `✏️ <b>Rename "${active.name}"</b>\n\nSend me the new name (max 32 characters):`,
      { parse_mode: 'HTML', ...getBackButton() }
    );
  } catch {
    await ctx.reply(
      `✏️ <b>Rename "${active.name}"</b>\n\nSend me the new name (max 32 characters):`,
      { parse_mode: 'HTML', ...getBackButton() }
    );
  }
}

// Called from the text handler when pendingRename is set
export async function handleRenameInput(ctx, text) {
  const walletId = getPendingRename(ctx.from.id);
  if (walletId === null) return false;
  clearPendingRename(ctx.from.id);
  const name = text.trim().slice(0, 32);
  if (!name) {
    await ctx.reply('Name cannot be empty. Rename cancelled.', getBackButton());
    return true;
  }
  const result = renameWallet(ctx.from.id, walletId, name);
  if (result.success) {
    await ctx.reply(`✅ Wallet renamed to <b>${name}</b>.`, {
      parse_mode: 'HTML',
      ...getWalletManagerMenu(getWalletSession(ctx.from.id)),
    });
  } else {
    await ctx.reply('Could not rename wallet.', getBackButton());
  }
  return true;
}

// ─── Delete: prompt confirmation ──────────────────────────────────────────────

export async function handleDeletePrompt(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  const active = getWalletSession(ctx.from.id);
  if (!active) return;
  try {
    await ctx.editMessageText(
      `🗑️ <b>Delete "${active.name}"?</b>\n\n` +
        `Are you sure you want to delete <b>${active.name}</b>? ` +
        `You can always restore it later if you saved your private key or seed phrase.`,
      { parse_mode: 'HTML', ...getDeleteConfirmKeyboard(active.id) }
    );
  } catch {
    await ctx.reply(
      `🗑️ <b>Delete "${active.name}"?</b>\n\n` +
        `Are you sure you want to delete <b>${active.name}</b>? ` +
        `You can always restore it later if you saved your private key or seed phrase.`,
      { parse_mode: 'HTML', ...getDeleteConfirmKeyboard(active.id) }
    );
  }
}

// ─── Delete: confirmed ────────────────────────────────────────────────────────

// Called for callback_data matching: wallet_delete_confirm_<id>
export async function handleDeleteConfirm(ctx) {
  const walletId = parseInt(ctx.match[1], 10);
  const result = deleteWallet(ctx.from.id, walletId);
  if (!result.success) {
    await ctx.answerCbQuery('Wallet not found.', { show_alert: true });
    return;
  }
  await ctx.answerCbQuery('🗑️ Wallet deleted.', { show_alert: false });
  if (result.remaining === 0) {
    try {
      await ctx.editMessageText(
        '🔐 All wallets deleted.\n\nCreate or import a wallet to get started.',
        { parse_mode: 'HTML', ...getInitialMenu() }
      );
    } catch {
      await ctx.reply(
        '🔐 All wallets deleted.\n\nCreate or import a wallet to get started.',
        { parse_mode: 'HTML', ...getInitialMenu() }
      );
    }
  } else {
    await handleWalletManager(ctx);
  }
}

// ─── Import method chooser ────────────────────────────────────────────────────

export async function handleImportMethodMenu(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  try {
    await ctx.editMessageText(
      '📥 <b>Import Wallet</b>\n\nHow would you like to import?',
      { parse_mode: 'HTML', ...getImportMethodKeyboard() }
    );
  } catch {
    await ctx.reply(
      '📥 <b>Import Wallet</b>\n\nHow would you like to import?',
      { parse_mode: 'HTML', ...getImportMethodKeyboard() }
    );
  }
}

// ─── Import by private key ────────────────────────────────────────────────────

export async function handleImportByKeyPrompt(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  // Store a flag so the text handler knows we're waiting for a private key
  // We reuse the same session.pendingRename slot but with a special sentinel
  // We'll use a simple in-memory map here
  pendingImportMode.set(ctx.from.id, 'key');
  try {
    await ctx.editMessageText(
      '🔑 <b>Import by Private Key</b>\n\n' +
        'Send your private key (with or without 0x prefix).\n\n' +
        '⚠️ Only do this in a private chat!',
      { parse_mode: 'HTML', ...getBackButton() }
    );
  } catch {
    await ctx.reply(
      '🔑 <b>Import by Private Key</b>\n\n' +
        'Send your private key (with or without 0x prefix).\n\n' +
        '⚠️ Only do this in a private chat!',
      { parse_mode: 'HTML', ...getBackButton() }
    );
  }
}

// ─── Import by mnemonic ───────────────────────────────────────────────────────

export async function handleImportByMnemonicPrompt(ctx) {
  await ctx.answerCbQuery().catch(() => {});
  pendingImportMode.set(ctx.from.id, 'mnemonic');
  try {
    await ctx.editMessageText(
      '📝 <b>Import by Seed Phrase</b>\n\n' +
        'Send your 12 or 24 word seed phrase (words separated by spaces).\n\n' +
        '⚠️ Only do this in a private chat!',
      { parse_mode: 'HTML', ...getBackButton() }
    );
  } catch {
    await ctx.reply(
      '📝 <b>Import by Seed Phrase</b>\n\n' +
        'Send your 12 or 24 word seed phrase (words separated by spaces).\n\n' +
        '⚠️ Only do this in a private chat!',
      { parse_mode: 'HTML', ...getBackButton() }
    );
  }
}

// ─── Pending import state (in-memory, same process lifetime as sessions) ─────

export const pendingImportMode = new Map(); // userId -> 'key' | 'mnemonic'

/**
 * Called from the text handler.
 * Returns true if it consumed the message, false otherwise.
 */
export async function handleImportInput(ctx, text) {
  const mode = pendingImportMode.get(ctx.from.id);
  if (!mode) return false;
  pendingImportMode.delete(ctx.from.id);

  let result;
  if (mode === 'mnemonic') {
    result = importWalletByMnemonic(ctx.from.id, text);
  } else {
    result = importWalletByKey(ctx.from.id, text);
  }

  if (result.success) {
    await ctx.reply(result.displayText, {
      parse_mode: 'HTML',
      ...getWalletManagerMenu(getWalletSession(ctx.from.id)),
    });
    // If the user now has at least one wallet show the main menu too
    setTimeout(async () => {
      await ctx.reply("Here's your main menu:", getMainMenu());
    }, 800);
  } else {
    await ctx.reply(`❌ ${result.error}`, getBackButton());
  }
  return true;
}

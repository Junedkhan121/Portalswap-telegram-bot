/**
 * Keyboard Layouts for Bot Navigation
 */

import { Markup } from 'telegraf';

/**
 * Initial menu - wallet setup
 */
export const getInitialMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🆕 Create New Wallet', 'wallet_create'),
      Markup.button.callback('📥 Import Wallet', 'wallet_import')
    ]
  ]);
};

/**
 * Main DEX menu - authenticated users
 */
export const getMainMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💰 Check Balance', 'balance'),
    ],
    [
      Markup.button.callback('🔄 Swap Tokens', 'swap'),
      Markup.button.callback('⚡ Stake tPOT', 'stake')
    ],
    [
      Markup.button.callback('💸 Send tPOT', 'transfer'),
      Markup.button.callback('🚰 Faucet', 'faucet')
    ],
    [
      Markup.button.callback('🗺️ Address Mapper', 'address_mapping'),
      Markup.button.callback('📊 Portfolio', 'portfolio')
    ],
    [
      Markup.button.callback('👜 Wallets', 'wallet_manager'),
      Markup.button.callback('ℹ️ Help', 'help')
    ]
  ]);
};

/**
 * Token selection keyboard for swap
 */
export const getTokenSelectionKeyboard = (context = 'from') => {
  const label = context === 'from' ? 'Swap FROM' : 'Swap TO';
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${label}: tPOTv3 (Native)`, `token_${context}_native`)],
    [Markup.button.callback(`${label}: pUSDT`, `token_${context}_pusdt`)],
    [Markup.button.callback(`${label}: pDAI`, `token_${context}_pdai`)],
    [Markup.button.callback(`${label}: pWBTC`, `token_${context}_pwbtc`)],
    [Markup.button.callback(`${label}: pLINK`, `token_${context}_plink`)],
    [Markup.button.callback('« Back', 'main_menu')]
  ]);
};

/**
 * Confirmation keyboard
 */
export const getConfirmationKeyboard = (action) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Confirm', `confirm_${action}`),
      Markup.button.callback('❌ Cancel', 'main_menu')
    ]
  ]);
};

/**
 * Back to main menu button
 */
export const getBackButton = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('« Back to Main Menu', 'main_menu')]
  ]);
};

/**
 * Staking action keyboard
 */
export const getStakingMenu = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Stake tPOT', 'stake_deposit'),
      Markup.button.callback('➖ Unstake', 'stake_withdraw')
    ],
    [
      Markup.button.callback('📊 My Stake', 'stake_info')
    ],
    [Markup.button.callback('« Back to Menu', 'main_menu')]
  ]);
};

/**
 * Wallet Manager menu — shown when user taps "👜 Wallets"
 *
 * @param {object} activeWallet - the currently active wallet entry
 */
export const getWalletManagerMenu = (activeWallet) => {
  const activeName = activeWallet?.name || 'Unknown';
  return Markup.inlineKeyboard([
    [Markup.button.callback(`Active: ${activeName}`, 'wallet_noop')],
    [
      Markup.button.callback('🔄 Switch Wallet', 'wallet_switch'),
      Markup.button.callback('✏️ Rename', 'wallet_rename')
    ],
    [
      Markup.button.callback('🆕 Add Wallet', 'wallet_create'),
      Markup.button.callback('📥 Import', 'wallet_import')
    ],
    [Markup.button.callback('🗑️ Delete This Wallet', 'wallet_delete_prompt')],
    [Markup.button.callback('« Back to Main Menu', 'main_menu')]
  ]);
};

/**
 * Switch wallet keyboard — one button per wallet, active one marked with ✓
 *
 * @param {Array} wallets  - session.wallets[]
 * @param {number} activeIndex - session.activeIndex
 */
export const getSwitchWalletKeyboard = (wallets, activeIndex) => {
  const rows = wallets.map((w, i) => {
    const label = i === activeIndex ? `✓ ${w.name}` : w.name;
    return [Markup.button.callback(label, `wallet_activate_${w.id}`)];
  });
  rows.push([Markup.button.callback('« Back', 'wallet_manager')]);
  return Markup.inlineKeyboard(rows);
};

/**
 * Delete-wallet confirmation keyboard
 *
 * @param {number} walletId - entry.id to delete
 */
export const getDeleteConfirmKeyboard = (walletId) => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⚠️ Yes, Delete It', `wallet_delete_confirm_${walletId}`)],
    [Markup.button.callback('Cancel', 'wallet_manager')]
  ]);
};

/**
 * Import method chooser — private key or seed phrase
 */
export const getImportMethodKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔑 Private Key', 'wallet_import_by_key')],
    [Markup.button.callback('📝 Seed Phrase', 'wallet_import_by_mnemonic')],
    [Markup.button.callback('« Back', 'wallet_manager')]
  ]);
};

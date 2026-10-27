/**
 * Main Bot Entry Point
 * PortalSwap Telegram Bot with SS58 Address Mapping
 */

import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import 'dotenv/config';

// Utils
import { createWallet, importWallet, hasActiveSession, getWalletSession } from './utils/wallet.js';
import { getAddressInfo } from './utils/ss58.js';

// Keyboards
import { getInitialMenu, getMainMenu, getBackButton } from './keyboards/index.js';

// Handlers
import { handleBalance } from './handlers/balance.js';
import {
  handleSwapStart,
  handleTokenSelection,
  handleSwapAmountInput,
  handleSwapConfirm,
  isInSwapFlow
} from './handlers/swap.js';
import {
  handleStakeMenu,
  handleStakeInfo,
  handleStakeDeposit,
  handleStakeWithdraw,
  handleStakeAmountInput,
  handleStakeDepositConfirm,
  handleStakeWithdrawConfirm,
  handleStakeClaimRewards,
  isInStakingFlow
} from './handlers/staking.js';
import {
  handleTransferStart,
  handleTransferAddressInput,
  handleTransferAmountInput,
  handleTransferConfirm,
  isInTransferFlow
} from './handlers/transfer.js';
import { setupFaucetHandlers } from './handlers/faucet.js';
import {
  handleMappingStart,
  handleMappingAddressInput,
  isInMappingFlow
} from './handlers/mapping.js';
import {
  handleWalletManager,
  handleSwitchWalletMenu,
  handleActivateWallet,
  handleRenamePrompt,
  handleRenameInput,
  handleDeletePrompt,
  handleDeleteConfirm,
  handleImportMethodMenu,
  handleImportByKeyPrompt,
  handleImportByMnemonicPrompt,
  handleImportInput,
  pendingImportMode,
} from './handlers/walletManager.js';

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize provider with increased timeout and retry logic
const provider = new ethers.JsonRpcProvider(
  process.env.PORTALDOT_EVM_RPC,
  undefined,
  {
    staticNetwork: ethers.Network.from({
      chainId: parseInt(process.env.PORTALDOT_CHAIN_ID),
      name: 'portaldot-v3-testnet'
    }),
    batchMaxCount: 1, // Disable batching to avoid timeout issues
  }
);

// Set custom timeout for provider requests (30 seconds)
provider.pollingInterval = 15000;

// Middleware: Check if wallet exists before allowing actions
const requireWallet = async (ctx, next) => {
  const userId = ctx.from.id;

  if (!hasActiveSession(userId)) {
    await ctx.answerCbQuery('⚠️ Please create or import a wallet first!', { show_alert: true });

    // Try to edit message if possible, otherwise send new message
    try {
      await ctx.editMessageText(
        '🔐 <b>Wallet Required</b>\n\n' +
        'You need to create or import a wallet before using this feature.\n\n' +
        'Choose an option below to get started:',
        {
          parse_mode: 'HTML',
          ...getInitialMenu()
        }
      );
    } catch (err) {
      // If edit fails, send new message
      await ctx.reply(
        '🔐 <b>Wallet Required</b>\n\n' +
        'You need to create or import a wallet before using this feature.\n\n' +
        'Choose an option below to get started:',
        {
          parse_mode: 'HTML',
          ...getInitialMenu()
        }
      );
    }
    return; // Stop execution
  }

  // Wallet exists, proceed
  return next();
};

// Setup faucet handlers (includes claim tokens & donate)
setupFaucetHandlers(bot, provider, (userId) => getWalletSession(userId), requireWallet);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.', getBackButton()).catch(() => {});
});

/**
 * /start command - Entry point
 */
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name || 'there';

  if (hasActiveSession(userId)) {
    // User already has wallet
    await ctx.reply(
      `👋 Welcome back, ${firstName}!\n\n` +
      `Your wallet is already loaded. What would you like to do?`,
      getMainMenu()
    );
  } else {
    // New user
    await ctx.reply(
      `👋 Welcome to <b>PortalSwap Bot</b>, ${firstName}!\n\n` +
      `🔷 Trade on Portaldot V3 Testnet directly from Telegram.\n\n` +
      `To get started, create a new wallet or import an existing one:`,
      {
        parse_mode: 'HTML',
        ...getInitialMenu()
      }
    );
  }
});

/**
 * Create Wallet
 */
bot.action('wallet_create', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const { displayText } = createWallet(userId);

  try {
    await ctx.editMessageText(displayText, { parse_mode: 'HTML' });
  } catch {
    await ctx.reply(displayText, { parse_mode: 'HTML' });
  }

  setTimeout(async () => {
    await ctx.reply("Here's your main menu:", getMainMenu());
  }, 1000);
});

/**
 * Import Wallet — now routes through method chooser
 */
bot.action('wallet_import', handleImportMethodMenu);
bot.action('wallet_import_by_key', handleImportByKeyPrompt);
bot.action('wallet_import_by_mnemonic', handleImportByMnemonicPrompt);

/**
 * Wallet Manager — multi-wallet: switch, rename, delete
 */
bot.action('wallet_manager', handleWalletManager);
bot.action('wallet_switch', handleSwitchWalletMenu);
bot.action(/^wallet_activate_(\d+)$/, handleActivateWallet);
bot.action('wallet_rename', handleRenamePrompt);
bot.action('wallet_delete_prompt', handleDeletePrompt);
bot.action(/^wallet_delete_confirm_(\d+)$/, handleDeleteConfirm);
bot.action('wallet_noop', (ctx) => ctx.answerCbQuery());

/**
 * Main Menu
 */
bot.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    '🏠 <b>Main Menu</b>\n\nSelect an action:',
    {
      parse_mode: 'HTML',
      ...getMainMenu()
    }
  );
});

/**
 * Balance Check - PROTECTED
 */
bot.action('balance', requireWallet, handleBalance);

/**
 * Swap Flow - PROTECTED
 */
bot.action('swap', requireWallet, handleSwapStart);
bot.action(/^token_(from|to)_/, requireWallet, handleTokenSelection);
bot.action('confirm_swap', requireWallet, handleSwapConfirm);

/**
 * Staking Flow - PROTECTED
 */
bot.action('stake', requireWallet, handleStakeMenu);
bot.action('stake_info', requireWallet, handleStakeInfo);
bot.action('stake_deposit', requireWallet, handleStakeDeposit);
bot.action('stake_withdraw', requireWallet, handleStakeWithdraw);
bot.action('stake_claim', requireWallet, handleStakeClaimRewards);
bot.action('confirm_stake_deposit', requireWallet, handleStakeDepositConfirm);
bot.action('confirm_stake_withdraw', requireWallet, handleStakeWithdrawConfirm);

/**
 * Transfer Flow - PROTECTED
 */
bot.action('transfer', requireWallet, handleTransferStart);
bot.action('confirm_transfer', requireWallet, handleTransferConfirm);

/**
 * Address Mapping - PUBLIC (can map any address without wallet)
 */
bot.action('address_mapping', handleMappingStart);

/**
 * Show Keys — moved into Wallet Manager (wallet_manager action).
 * Kept as a fallback alias so any deep-linked references still work.
 */
bot.action('show_keys', requireWallet, async (ctx) => {
  const userId = ctx.from.id;
  const active = getWalletSession(userId); // returns active wallet entry
  await ctx.answerCbQuery();
  const addressInfo = getAddressInfo(active.address);
  const mnemonicLine = active.mnemonic
    ? `\n\n📝 <b>Seed Phrase:</b>\n<code>${active.mnemonic}</code>`
    : '';
  await ctx.reply(
    `🔑 <b>${active.name}</b>\n\n` +
    addressInfo.displayText +
    `\n\n🔐 <b>Private Key:</b>\n<code>${active.privateKey}</code>` +
    mnemonicLine +
    `\n\n⚠️ Keep all of the above safe and never share them!`,
    { parse_mode: 'HTML', ...getBackButton() }
  );
});

/**
 * Portfolio - PROTECTED
 */
bot.action('portfolio', requireWallet, async (ctx) => {
  await ctx.answerCbQuery();

  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  await ctx.editMessageText(
    `📊 <b>Portfolio</b>\n\n` +
    `Coming soon! This will show:\n` +
    `• Token holdings & values\n` +
    `• LP positions\n` +
    `• Staking rewards\n` +
    `• Transaction history\n\n` +
    `For now, use "💰 Check Balance" to see your tokens.`,
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
});

/**
 * Faucet
 * Handler imported from handlers/faucet.js (includes claim tokens & donate features)
 */

/**
 * Help
 */
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();

  const helpText =
    `ℹ️ <b>PortalSwap Bot Help</b>\n\n` +
    `<b>Features:</b>\n` +
    `• Swap tokens on Portaldot V3 testnet\n` +
    `• Stake tPOT for rewards\n` +
    `• Map any EVM address to Portal format\n` +
    `• Check balances and portfolio\n\n` +
    `<b>Addresses:</b>\n` +
    `• EVM (0x...): For contract interactions\n` +
    `• SS58 (5...): For receiving testnet gas\n` +
    `• Use Address Mapper to convert between formats!\n\n` +
    `<b>Security:</b>\n` +
    `• Your keys are stored in-session only\n` +
    `• Always verify transaction details\n` +
    `• This is testnet — use test funds only\n\n` +
    `🌐 App: portalswap.live\n` +
    `📘 GitHub: github.com/Junedkhan121/PortalSwap`;

  await ctx.editMessageText(helpText, {
    parse_mode: 'HTML',
    ...getBackButton()
  });
});

/**
 * Text Message Handler
 * Handles private key import and amount inputs
 */
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();

  // 1. Check pending wallet rename
  if (await handleRenameInput(ctx, text)) return;

  // 2. Check pending wallet import (key or mnemonic via wallet manager)
  if (await handleImportInput(ctx, text)) return;

  // 3. Check if user is importing wallet (no active session + looks like private key or mnemonic)
  if (!hasActiveSession(userId) && (text.startsWith('0x') || text.length === 64 || text.length === 66 || text.split(' ').length >= 12)) {
    const result = importWallet(userId, text);

    if (result.success) {
      await ctx.reply(result.displayText, { parse_mode: 'HTML' });
      setTimeout(async () => {
        await ctx.reply('🎉 Setup complete! Here\'s your main menu:', getMainMenu());
      }, 1000);
    } else {
      await ctx.reply(`❌ ${result.error}\n\nPlease try again.`);
    }
    return;
  }

  // Check if user is in transfer flow
  if (isInTransferFlow(userId)) {
    // Step 1: Waiting for recipient address
    if (text.startsWith('5')) {
      await handleTransferAddressInput(ctx, text);
      return;
    }

    // Step 2: Waiting for amount
    await handleTransferAmountInput(ctx);
    return;
  }

  // Check if user is in swap flow
  if (isInSwapFlow(userId)) {
    await handleSwapAmountInput(ctx);
    return;
  }

  // Check if user is in staking flow
  if (isInStakingFlow(userId)) {
    await handleStakeAmountInput(ctx);
    return;
  }

  // Check if user is in address mapping flow (checked last — mapping session
  // can persist in memory after user navigates away, so wallet-gated flows take priority)
  if (isInMappingFlow(userId)) {
    await handleMappingAddressInput(ctx, text);
    return;
  }

  // Default: show main menu or initial menu
  if (hasActiveSession(userId)) {
    await ctx.reply(
      'Please use the menu buttons to navigate.',
      getMainMenu()
    );
  } else {
    await ctx.reply(
      'Please create or import a wallet first.',
      getInitialMenu()
    );
  }
});

/**
 * Launch bot
 */
console.log('🤖 Starting PortalSwap Telegram Bot...');
console.log('📡 Network: Portaldot V3 Testnet');
console.log('⚡ Chain ID:', process.env.PORTALDOT_CHAIN_ID);
console.log('🔗 RPC:', process.env.PORTALDOT_EVM_RPC);

bot.launch()
  .then(() => {
    console.log('✅ Bot is running!');
    console.log('💬 Send /start to begin');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('\n🛑 SIGINT received, stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
});

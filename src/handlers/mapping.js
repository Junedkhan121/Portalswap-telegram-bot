/**
 * Address Mapping Handler
 * Maps any EVM address to Portal (SS58) address
 */

import { getAddressInfo } from '../utils/ss58.js';
import { getBackButton } from '../keyboards/index.js';

// Mapping session storage (in production: use database)
const mappingSessions = new Map();

/**
 * Start address mapping flow
 */
export async function handleMappingStart(ctx) {
  const userId = ctx.from.id;

  await ctx.answerCbQuery();

  // Initialize mapping session
  mappingSessions.set(userId, {
    step: 'enter_address'
  });

  await ctx.editMessageText(
    '🗺️ <b>Address Mapper</b>\n\n' +
    '✨ This tool converts any EVM address (0x...) to a Portal address that starts with "5".\n\n' +
    '<b>How It Works:</b>\n' +
    '1️⃣ You provide an EVM address (like 0x1234...)\n' +
    '2️⃣ We decode the hex bytes from the address\n' +
    '3️⃣ We encode those bytes using SS58 format with Portal prefix\n' +
    '4️⃣ You get a Portal address (starts with 5...)\n\n' +
    '<b>Why?</b>\n' +
    '• Portal testnet faucets require SS58 addresses\n' +
    '• Both addresses control the same account!\n' +
    '• Same private key works for both formats\n\n' +
    '📝 Please send the EVM address you want to map:',
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

/**
 * Handle address input
 */
export async function handleMappingAddressInput(ctx, address) {
  const userId = ctx.from.id;
  const mappingSession = mappingSessions.get(userId);

  if (!mappingSession || mappingSession.step !== 'enter_address') {
    return; // Not in mapping flow
  }

  // Validate address format
  if (!address.startsWith('0x') || address.length !== 42) {
    return ctx.reply(
      '⚠️ Invalid EVM address format.\n\n' +
      'Address should:\n' +
      '• Start with "0x"\n' +
      '• Be exactly 42 characters long\n\n' +
      'Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n\n' +
      'Please try again:',
      { parse_mode: 'HTML' }
    );
  }

  try {
    await ctx.reply('⏳ Mapping your address...');

    // Get address info (this calls ss58.js which does the encoding)
    const addressInfo = getAddressInfo(address);

    // Show detailed explanation
    const explanationText =
      `✅ <b>Address Mapped Successfully!</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔷 <b>EVM Address (Hex)</b>\n` +
      `<code>${address}</code>\n\n` +
      `🔷 <b>Portal Address (SS58)</b>\n` +
      `<code>${addressInfo.ss58}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>🧠 How This Works:</b>\n\n` +
      `<b>Step 1: Extract Bytes</b>\n` +
      `Your EVM address is just hex-encoded bytes.\n` +
      `We extract those bytes: <code>${address.slice(2)}</code>\n\n` +
      `<b>Step 2: Add Network Prefix</b>\n` +
      `Portal network uses prefix <b>42</b> in SS58 format.\n` +
      `This prefix makes addresses start with "5".\n\n` +
      `<b>Step 3: Encode with Checksum</b>\n` +
      `We encode the bytes + prefix using Base58 encoding.\n` +
      `We add a checksum for error detection.\n` +
      `Result: An address starting with "5"!\n\n` +
      `<b>🔑 Important:</b>\n` +
      `• Both addresses are the SAME account\n` +
      `• Same private key controls both\n` +
      `• Use EVM (0x) for contracts & swaps\n` +
      `• Use SS58 (5) for testnet faucets\n\n` +
      `💡 <b>Fun Fact:</b> Polkadot, Kusama, and other Substrate chains use this same SS58 format, just with different prefixes!`;

    await ctx.reply(explanationText, {
      parse_mode: 'HTML',
      ...getBackButton()
    });

    // Clean up session
    mappingSessions.delete(userId);

  } catch (error) {
    console.error('Mapping error:', error);
    await ctx.reply(
      '❌ Failed to map address. Please make sure it\'s a valid EVM address and try again.',
      getBackButton()
    );
    mappingSessions.delete(userId);
  }
}

/**
 * Check if user is in mapping flow
 */
export function isInMappingFlow(userId) {
  const session = mappingSessions.get(userId);
  return session && session.step === 'enter_address';
}

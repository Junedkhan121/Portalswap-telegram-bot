/**
 * Transfer Handler - Send tPOT to SS58 addresses
 */

import { ethers } from 'ethers';
import { getWalletSession } from '../utils/wallet.js';
import { getMainMenu, getBackButton } from '../keyboards/index.js';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

// Track users in transfer flow
const transferFlows = new Map();

/**
 * Check if user is in transfer flow
 */
export function isInTransferFlow(userId) {
  return transferFlows.has(userId);
}

/**
 * Start transfer flow
 */
export async function handleTransferStart(ctx) {
  await ctx.answerCbQuery();

  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found.', getBackButton());
  }

  // Initialize transfer flow
  transferFlows.set(userId, { step: 'awaiting_address' });

  await ctx.editMessageText(
    `💸 <b>Send tPOT</b>\n\n` +
    `Please send the <b>recipient's SS58 address</b> (starts with 5...):\n\n` +
    `Example: <code>5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY</code>\n\n` +
    `💡 <i>Tip: You can only send to SS58 addresses for native tPOT transfers</i>`,
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

/**
 * Handle recipient address input
 */
export async function handleTransferAddressInput(ctx, recipientAddress) {
  const userId = ctx.from.id;
  const flow = transferFlows.get(userId);

  if (!flow || flow.step !== 'awaiting_address') {
    return;
  }

  // Validate SS58 address format
  if (!recipientAddress.startsWith('5')) {
    await ctx.reply(
      `❌ Invalid address format!\n\n` +
      `Please send a valid SS58 address starting with "5".\n\n` +
      `Example: <code>5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
    return;
  }

  // Try to decode SS58 address to validate it
  let evmRecipient;
  try {
    const decoded = decodeAddress(recipientAddress);
    // Extract first 20 bytes (EVM address) from the 32-byte decoded address
    const evmBytes = decoded.slice(0, 20);
    evmRecipient = '0x' + u8aToHex(evmBytes).slice(2);
  } catch (error) {
    await ctx.reply(
      `❌ Invalid SS58 address!\n\n` +
      `Please check the address and try again.`,
      getBackButton()
    );
    return;
  }

  // Update flow state
  transferFlows.set(userId, {
    step: 'awaiting_amount',
    recipient: recipientAddress,
    recipientEvm: evmRecipient
  });

  await ctx.reply(
    `✅ <b>Recipient Address:</b>\n<code>${recipientAddress}</code>\n\n` +
    `💰 How much tPOT would you like to send?\n\n` +
    `Example: <code>0.5</code> or <code>1.0</code>`,
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

/**
 * Handle amount input and show confirmation
 */
export async function handleTransferAmountInput(ctx) {
  const userId = ctx.from.id;
  const flow = transferFlows.get(userId);

  if (!flow || flow.step !== 'awaiting_amount') {
    return;
  }

  const amountStr = ctx.message.text.trim();
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(
      `❌ Invalid amount!\n\n` +
      `Please enter a valid number greater than 0.\n\n` +
      `Example: <code>0.5</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
    return;
  }

  // Update flow state
  transferFlows.set(userId, {
    ...flow,
    step: 'awaiting_confirm',
    amount: amount
  });

  await ctx.reply(
    `🔍 <b>Transfer Confirmation</b>\n\n` +
    `<b>To:</b> <code>${flow.recipient}</code>\n\n` +
    `<b>Amount:</b> ${amount} tPOT\n\n` +
    `⚠️ <i>Make sure the recipient address is correct. Transactions cannot be reversed!</i>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm Transfer', callback_data: 'confirm_transfer' },
            { text: '❌ Cancel', callback_data: 'main_menu' }
          ]
        ]
      }
    }
  );
}

/**
 * Execute transfer transaction
 */
export async function handleTransferConfirm(ctx) {
  await ctx.answerCbQuery();

  const userId = ctx.from.id;
  const flow = transferFlows.get(userId);

  if (!flow || flow.step !== 'awaiting_confirm') {
    return ctx.reply('⚠️ Transfer session expired.', getMainMenu());
  }

  const session = getWalletSession(userId);
  if (!session) {
    transferFlows.delete(userId);
    return ctx.reply('⚠️ No wallet found.', getBackButton());
  }

  await ctx.editMessageText(`⏳ <b>Processing transfer...</b>`, {
    parse_mode: 'HTML'
  });

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.PORTALDOT_EVM_RPC);
    const wallet = new ethers.Wallet(session.privateKey, provider);

    // Prepare transfer transaction
    const amountWei = ethers.parseEther(flow.amount.toString());

    const tx = await wallet.sendTransaction({
      to: flow.recipientEvm,
      value: amountWei
    });

    await ctx.editMessageText(
      `⏳ <b>Transaction sent!</b>\n\n` +
      `Waiting for confirmation...\n\n` +
      `TX Hash: <code>${tx.hash}</code>`,
      { parse_mode: 'HTML' }
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    // Clear flow
    transferFlows.delete(userId);

    await ctx.reply(
      `✅ <b>Transfer Successful!</b>\n\n` +
      `<b>Amount:</b> ${flow.amount} tPOT\n` +
      `<b>To:</b> <code>${flow.recipient}</code>\n\n` +
      `<b>TX Hash:</b>\n<code>${receipt.hash}</code>\n\n` +
      `<b>Block:</b> ${receipt.blockNumber}\n` +
      `<b>Status:</b> ${receipt.status === 1 ? 'Success ✅' : 'Failed ❌'}`,
      {
        parse_mode: 'HTML',
        ...getMainMenu()
      }
    );
  } catch (error) {
    console.error('Transfer error:', error);

    transferFlows.delete(userId);

    let errorMsg = '❌ <b>Transfer Failed!</b>\n\n';

    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMsg += 'Insufficient balance for this transfer + gas fees.';
    } else if (error.message.includes('nonce')) {
      errorMsg += 'Transaction nonce error. Please try again.';
    } else {
      errorMsg += `Error: ${error.message || 'Unknown error'}`;
    }

    await ctx.reply(errorMsg, {
      parse_mode: 'HTML',
      ...getMainMenu()
    });
  }
}

/**
 * Cancel transfer and clear flow
 */
export function cancelTransfer(userId) {
  transferFlows.delete(userId);
}

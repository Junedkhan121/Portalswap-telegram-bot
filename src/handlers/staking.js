/**
 * Staking Handler
 * Handle tPOT staking operations
 */

import { ethers } from 'ethers';
import { getWalletSession, getWalletSigner } from '../utils/wallet.js';
import {
  getProvider,
  getStakingContract,
  getTokenContract,
  CONTRACTS,
  parseTokenAmount,
  formatTokenAmount
} from '../utils/contracts.js';
import { getStakingMenu, getConfirmationKeyboard, getBackButton } from '../keyboards/index.js';

// Staking session storage
const stakingSessions = new Map();

/**
 * Show staking menu
 */
export async function handleStakeMenu(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found. Please create or import a wallet first.', getBackButton());
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    '⚡ <b>tPOT Staking</b>\n\n' +
    'Stake your tPOT tokens to earn rewards.\n\n' +
    'Select an action:',
    {
      parse_mode: 'HTML',
      ...getStakingMenu()
    }
  );
}

/**
 * Show stake info
 */
export async function handleStakeInfo(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found.', getBackButton());
  }

  try {
    await ctx.answerCbQuery();
    await ctx.reply('⏳ Fetching stake info...');

    const provider = getProvider();
    const staking = getStakingContract(provider);

    const staked = await staking.stakedBalance(session.address);
    const totalStaked = await staking.totalStaked();

    const stakedFormatted = formatTokenAmount(staked, 18);
    const totalStakedFormatted = formatTokenAmount(totalStaked, 18);

    await ctx.reply(
      `⚡ <b>Your Stake Info</b>\n\n` +
      `Your Staked: ${parseFloat(stakedFormatted).toFixed(6)} tPOT\n` +
      `Total Staked: ${parseFloat(totalStakedFormatted).toFixed(2)} tPOT\n\n` +
      `Note: No rewards in v1. This tracks TVL only.\n\n` +
      `<code>${session.address}</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
  } catch (error) {
    console.error('Stake info error:', error);
    await ctx.reply('❌ Failed to fetch stake info.', getBackButton());
  }
}

/**
 * Start stake deposit flow
 */
export async function handleStakeDeposit(ctx) {
  const userId = ctx.from.id;

  await ctx.answerCbQuery();

  stakingSessions.set(userId, {
    action: 'deposit',
    step: 'amount'
  });

  await ctx.editMessageText(
    '⚡ <b>Stake tPOT</b>\n\n' +
    'Enter the amount of tPOT you want to stake:',
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

/**
 * Start unstake flow
 */
export async function handleStakeWithdraw(ctx) {
  const userId = ctx.from.id;

  await ctx.answerCbQuery();

  stakingSessions.set(userId, {
    action: 'withdraw',
    step: 'amount'
  });

  await ctx.editMessageText(
    '⚡ <b>Unstake tPOT</b>\n\n' +
    'Enter the amount of tPOT you want to unstake:',
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

/**
 * Handle stake amount input
 */
export async function handleStakeAmountInput(ctx) {
  const userId = ctx.from.id;
  const stakingSession = stakingSessions.get(userId);

  if (!stakingSession || stakingSession.step !== 'amount') {
    return; // Not in staking flow
  }

  const amountText = ctx.message.text.trim();
  const amount = parseFloat(amountText);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('⚠️ Invalid amount. Please enter a valid number greater than 0.');
  }

  stakingSession.amount = amount;
  stakingSession.step = 'confirm';
  stakingSessions.set(userId, stakingSession);

  const action = stakingSession.action === 'deposit' ? 'Stake' : 'Unstake';

  await ctx.reply(
    `⚡ <b>Confirm ${action}</b>\n\n` +
    `Amount: ${amount} tPOT\n\n` +
    `⚠️ This will execute on Portaldot V3 Testnet.`,
    {
      parse_mode: 'HTML',
      ...getConfirmationKeyboard(`stake_${stakingSession.action}`)
    }
  );
}

/**
 * Execute stake deposit
 */
export async function handleStakeDepositConfirm(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);
  const stakingSession = stakingSessions.get(userId);

  if (!stakingSession || stakingSession.action !== 'deposit') {
    return ctx.answerCbQuery('⚠️ Session expired');
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText('⏳ <b>Staking tPOT...</b>', { parse_mode: 'HTML' });

  try {
    const provider = getProvider();
    const signer = getWalletSigner(userId, provider);
    const staking = getStakingContract(signer);

    const amount = parseTokenAmount(stakingSession.amount, 18);

    // Stake by sending native tPOT (no approve needed - it's the native token)
    const tx = await staking.stake({ value: amount });
    const receipt = await tx.wait();

    await ctx.editMessageText(
      `✅ <b>Staking Successful!</b>\n\n` +
      `Staked: ${stakingSession.amount} tPOT\n\n` +
      `Tx: <code>${receipt.hash}</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );

    stakingSessions.delete(userId);
  } catch (error) {
    console.error('Stake error:', error);
    await ctx.editMessageText(
      `❌ <b>Staking Failed</b>\n\n` +
      `Error: ${error.message}\n\n` +
      `Please check your balance and try again.`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
    stakingSessions.delete(userId);
  }
}

/**
 * Execute unstake
 */
export async function handleStakeWithdrawConfirm(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);
  const stakingSession = stakingSessions.get(userId);

  if (!stakingSession || stakingSession.action !== 'withdraw') {
    return ctx.answerCbQuery('⚠️ Session expired');
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText('⏳ <b>Unstaking tPOT...</b>', { parse_mode: 'HTML' });

  try {
    const provider = getProvider();
    const signer = getWalletSigner(userId, provider);
    const staking = getStakingContract(signer);

    const amount = parseTokenAmount(stakingSession.amount, 18);

    const tx = await staking.withdraw(amount);
    const receipt = await tx.wait();

    await ctx.editMessageText(
      `✅ <b>Unstaking Successful!</b>\n\n` +
      `Unstaked: ${stakingSession.amount} tPOT\n\n` +
      `Tx: <code>${receipt.hash}</code>`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );

    stakingSessions.delete(userId);
  } catch (error) {
    console.error('Unstake error:', error);
    await ctx.editMessageText(
      `❌ <b>Unstaking Failed</b>\n\n` +
      `Error: ${error.message}`,
      {
        parse_mode: 'HTML',
        ...getBackButton()
      }
    );
    stakingSessions.delete(userId);
  }
}

/**
 * Claim rewards
 */
export async function handleStakeClaimRewards(ctx) {
  await ctx.answerCbQuery();
  await ctx.reply(
    '⚠️ <b>No Rewards Yet</b>\n\n' +
    'The staking contract v1 tracks TVL only.\n' +
    'Rewards will be added in a future update.',
    {
      parse_mode: 'HTML',
      ...getBackButton()
    }
  );
}

// Export for text message handler
export function isInStakingFlow(userId) {
  const session = stakingSessions.get(userId);
  return session && session.step === 'amount';
}

/**
 * Cancel staking flow (called when user starts a different flow)
 */
export function cancelStaking(userId) {
  stakingSessions.delete(userId);
}

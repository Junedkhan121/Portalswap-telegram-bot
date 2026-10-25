/**
 * Balance Handler
 * Fetch and display user balances
 */

import { ethers } from 'ethers';
import { getWalletSession } from '../utils/wallet.js';
import { getProvider, getTokenContract, CONTRACTS, formatTokenAmount } from '../utils/contracts.js';
import { getBackButton } from '../keyboards/index.js';

export async function handleBalance(ctx) {
  const userId = ctx.from.id;
  const session = getWalletSession(userId);

  if (!session) {
    return ctx.reply('⚠️ No wallet found. Please create or import a wallet first.', getBackButton());
  }

  try {
    await ctx.answerCbQuery();
    await ctx.reply('⏳ Fetching balances...');

    const provider = getProvider();
    const address = session.address;

    // Fetch native balance
    const nativeBalance = await provider.getBalance(address);
    const nativeFormatted = ethers.formatEther(nativeBalance);

    // Fetch token balances
    const tokens = [
      { name: 'pUSDT', address: CONTRACTS.TOKENS.pUSDT, decimals: 6 },
      { name: 'pDAI', address: CONTRACTS.TOKENS.pDAI, decimals: 18 },
      { name: 'pWBTC', address: CONTRACTS.TOKENS.pWBTC, decimals: 8 },
      { name: 'pLINK', address: CONTRACTS.TOKENS.pLINK, decimals: 18 }
    ];

    let balanceText = `💰 <b>Your Balances</b>\n\n`;
    balanceText += `<b>Native:</b>\n`;
    balanceText += `  tPOTv3: ${parseFloat(nativeFormatted).toFixed(6)}\n\n`;
    balanceText += `<b>Tokens:</b>\n`;

    for (const token of tokens) {
      try {
        const contract = getTokenContract(token.address, provider);
        const balance = await contract.balanceOf(address);
        const formatted = formatTokenAmount(balance, token.decimals);
        balanceText += `  ${token.name}: ${parseFloat(formatted).toFixed(6)}\n`;
      } catch (error) {
        balanceText += `  ${token.name}: Error fetching\n`;
      }
    }

    balanceText += `\n<code>${address}</code>`;

    await ctx.reply(balanceText, {
      parse_mode: 'HTML',
      ...getBackButton()
    });

  } catch (error) {
    console.error('Balance fetch error:', error);

    let errorMessage = '❌ Failed to fetch balances.\n\n';

    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      errorMessage += '⏱️ <b>RPC Timeout</b>\n\n' +
        'The Portaldot testnet RPC is not responding. This could be:\n' +
        '• Temporary network congestion\n' +
        '• RPC node maintenance\n' +
        '• High traffic on testnet\n\n' +
        '💡 <b>Try:</b>\n' +
        '1. Wait a few minutes and try again\n' +
        '2. Check if portalswap.live is working\n' +
        '3. Use the web app if bot is slow\n\n' +
        '🔗 <a href="https://portalswap.live">portalswap.live</a>';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage += '🌐 <b>Network Error</b>\n\n' +
        'Cannot connect to Portaldot testnet.\n' +
        'Please try again in a few moments.';
    } else {
      errorMessage += 'Please try again later.';
    }

    await ctx.reply(errorMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...getBackButton()
    });
  }
}

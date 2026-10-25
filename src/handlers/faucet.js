import { ethers } from 'ethers';

// ERC20 faucet ABI (mint function)
const ERC20_FAUCET_ABI = [
  'function faucet(address recipient, uint256 amount) external',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

// tPOT Faucet ABI (donate function)
const TPOT_FAUCET_ABI = [
  'function donate() external payable',
  'function poolBalance() external view returns (uint256)',
];

// Test token addresses and mint amounts
const TEST_TOKENS = {
  pUSDT: {
    address: process.env.PUSDT_ADDRESS,
    amount: '10',
    decimals: 6,
    name: 'Portal USDT',
  },
  pDAI: {
    address: process.env.PDAI_ADDRESS,
    amount: '10',
    decimals: 18,
    name: 'Portal DAI',
  },
  pWBTC: {
    address: process.env.PWBTC_ADDRESS,
    amount: '0.01',
    decimals: 8,
    name: 'Portal WBTC',
  },
  pLINK: {
    address: process.env.PLINK_ADDRESS,
    amount: '0.5',
    decimals: 18,
    name: 'Portal LINK',
  },
};

// Store user states
const userStates = new Map();

export function setupFaucetHandlers(bot, provider, getWallet) {

  // Faucet menu action
  bot.action('faucet', async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const wallet = getWallet(ctx.from.id);
      if (!wallet) {
        return ctx.reply('⚠️ No wallet found. Send /start to create one first.');
      }

      const addressInfo = await getAddressInfo(wallet.address);

      const message = `🚰 *Testnet Faucet*\n\n` +
        `Get Free Testnet Tokens:\n\n` +
        `💧 *Native tPOT* (for gas):\n` +
        `   Send tPOT to your SS58 address:\n` +
        `   \`${addressInfo.ss58}\`\n\n` +
        `🪙 *Test Tokens* (pUSDT, pDAI, pWBTC, pLINK):\n` +
        `   Visit: [portalswap.live](https://portalswap.live/)\n` +
        `   Connect wallet and use the Faucet tab\n\n` +
        `💡 *Tip:* You need tPOT first to pay for minting test tokens!`;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🪙 Claim Test Tokens', callback_data: 'claim_tokens' }],
            [{ text: '💧 Donate tPOT to Faucet', callback_data: 'donate_faucet' }],
            [{ text: '« Back', callback_data: 'back_main' }],
          ],
        },
      });
    } catch (error) {
      console.error('Faucet error:', error);
      await ctx.reply('❌ Error displaying faucet menu.');
    }
  });

  // Claim test tokens menu
  bot.action('claim_tokens', async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const wallet = getWallet(ctx.from.id);
      if (!wallet) {
        return ctx.reply('⚠️ No wallet found. Send /start to create one first.');
      }

      await ctx.reply(
        '🪙 *Claim Test Tokens*\n\n' +
        'Select a token to mint:\n\n' +
        '• *pUSDT* - 10 tokens\n' +
        '• *pDAI* - 10 tokens\n' +
        '• *pWBTC* - 0.01 tokens\n' +
        '• *pLINK* - 0.5 tokens\n\n' +
        '⚠️ You need tPOT in your wallet to pay for gas!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💵 pUSDT (10)', callback_data: 'mint_pUSDT' },
                { text: '💎 pDAI (10)', callback_data: 'mint_pDAI' },
              ],
              [
                { text: '₿ pWBTC (0.01)', callback_data: 'mint_pWBTC' },
                { text: '🔗 pLINK (0.5)', callback_data: 'mint_pLINK' },
              ],
              [{ text: '« Back', callback_data: 'faucet' }],
            ],
          },
        }
      );
    } catch (error) {
      console.error('Claim tokens error:', error);
      await ctx.reply('❌ Error displaying token menu.');
    }
  });

  // Handle token minting
  Object.keys(TEST_TOKENS).forEach(symbol => {
    bot.action(`mint_${symbol}`, async (ctx) => {
      try {
        await ctx.answerCbQuery();

        const wallet = getWallet(ctx.from.id);
        if (!wallet) {
          return ctx.reply('⚠️ No wallet found. Send /start to create one first.');
        }

        const token = TEST_TOKENS[symbol];
        const statusMsg = await ctx.reply(`⏳ Minting ${token.amount} ${symbol}...`);

        try {
          // Check if user has enough tPOT for gas
          const balance = await provider.getBalance(wallet.address);
          const minBalance = ethers.parseEther("0.01"); // Need at least 0.01 tPOT for gas

          if (balance < minBalance) {
            return ctx.telegram.editMessageText(
              ctx.chat.id,
              statusMsg.message_id,
              null,
              `❌ Insufficient tPOT for gas!\n\n` +
              `Your balance: ${ethers.formatEther(balance)} tPOT\n` +
              `Minimum needed: 0.01 tPOT\n\n` +
              `Please claim tPOT from the native faucet first:\n` +
              `https://faucet.portaldot.io/\n\n` +
              `Send tPOT to your SS58 address:\n\`${wallet.ss58}\``,
              { parse_mode: 'Markdown' }
            );
          }

          // Connect wallet with provider (EXACTLY like website does)
          const connectedWallet = new ethers.Wallet(wallet.privateKey, provider);

          // Create contract instance with signer (EXACTLY like website)
          const tokenContract = new ethers.Contract(token.address, ERC20_FAUCET_ABI, connectedWallet);

          // Call faucet method directly (EXACTLY like website does at line 36-39)
          const amount = ethers.parseUnits(token.amount, token.decimals);
          const tx = await tokenContract.faucet(wallet.address, amount);

          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `⏳ Transaction sent! Waiting for confirmation...\n\nTx: \`${tx.hash}\``,
            { parse_mode: 'Markdown' }
          );

          // Wait for confirmation (EXACTLY like website)
          await tx.wait();

          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            `✅ *Minted ${token.amount} ${symbol}!*\n\n` +
            `Tx: \`${receipt.hash}\`\n` +
            `Block: ${receipt.blockNumber}`,
            { parse_mode: 'Markdown' }
          );

        } catch (error) {
          console.error(`Mint ${symbol} error:`, error);

          let errorMsg = '❌ Minting failed!';
          if (error.message.includes('insufficient funds')) {
            errorMsg = '❌ Insufficient tPOT for gas! Get some from the faucet first.';
          } else if (error.message.includes('nonce')) {
            errorMsg = '❌ Transaction conflict. Please try again.';
          } else {
            errorMsg = `❌ Minting failed: ${error.reason || error.message}`;
          }

          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            null,
            errorMsg
          );
        }
      } catch (error) {
        console.error('Mint handler error:', error);
        await ctx.reply('❌ Error processing mint request.');
      }
    });
  });

  // Donate to faucet action
  bot.action('donate_faucet', async (ctx) => {
    try {
      await ctx.answerCbQuery();

      const wallet = getWallet(ctx.from.id);
      if (!wallet) {
        return ctx.reply('⚠️ No wallet found. Send /start to create one first.');
      }

      userStates.set(ctx.from.id, { action: 'donate_faucet' });

      await ctx.reply(
        '💧 *Donate tPOT to Faucet*\n\n' +
        'Help keep the faucet running for everyone!\n\n' +
        'Enter the amount of tPOT you want to donate:\n\n' +
        '_(Example: 5)_',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '« Cancel', callback_data: 'faucet' }]],
          },
        }
      );
    } catch (error) {
      console.error('Donate faucet error:', error);
      await ctx.reply('❌ Error initiating donation.');
    }
  });

  // Text handler for donation flow
  bot.on('text', async (ctx, next) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);

    if (!state || state.action !== 'donate_faucet') {
      return next();
    }

    const wallet = getWallet(userId);
    if (!wallet) {
      userStates.delete(userId);
      return ctx.reply('⚠️ No wallet found.');
    }

    const amount = ctx.message.text.trim();

    // Validate amount
    if (!/^\d+(\.\d+)?$/.test(amount) || parseFloat(amount) <= 0) {
      return ctx.reply('❌ Invalid amount. Please enter a positive number (e.g., 5 or 2.5)');
    }

    userStates.delete(userId);

    const statusMsg = await ctx.reply(`⏳ Donating ${amount} tPOT to faucet...`);

    try {
      // Connect wallet with provider
      const connectedWallet = new ethers.Wallet(wallet.privateKey, provider);

      // Create faucet contract instance
      const faucetContract = new ethers.Contract(
        process.env.FAUCET_ADDRESS,
        TPOT_FAUCET_ABI,
        connectedWallet
      );

      const value = ethers.parseEther(amount);

      // Send donation (let ethers handle gas estimation)
      const tx = await faucetContract.donate({ value });

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `⏳ Transaction sent! Waiting for confirmation...\n\nTx: \`${tx.hash}\``,
        { parse_mode: 'Markdown' }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      // Get new pool balance
      const poolBalance = await faucetContract.poolBalance();
      const poolFormatted = parseFloat(ethers.formatEther(poolBalance)).toFixed(4);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `✅ *Donated ${amount} tPOT — Thank you!*\n\n` +
        `Tx: \`${receipt.hash}\`\n` +
        `Block: ${receipt.blockNumber}\n\n` +
        `💧 New Pool Balance: ${poolFormatted} tPOT`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Donate error:', error);

      let errorMsg = '❌ Donation failed!';
      if (error.message.includes('insufficient funds')) {
        errorMsg = '❌ Insufficient tPOT balance!';
      } else if (error.message.includes('nonce')) {
        errorMsg = '❌ Transaction conflict. Please try again.';
      } else {
        errorMsg = `❌ Donation failed: ${error.reason || error.message}`;
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        errorMsg
      );
    }
  });
}

// Helper function to get address info (from wallet.js)
async function getAddressInfo(evmAddress) {
  try {
    const addrBytes = ethers.getBytes(evmAddress);
    const fallback = new Uint8Array(32);
    fallback.set(addrBytes, 0);
    fallback.fill(0xee, 20);

    // Use dynamic import for @polkadot/util-crypto
    const { encodeAddress } = await import('@polkadot/util-crypto');
    const ss58 = encodeAddress(fallback, 42);

    return {
      evm: evmAddress,
      ss58: ss58,
    };
  } catch (error) {
    return {
      evm: evmAddress,
      ss58: 'Error generating SS58',
    };
  }
}

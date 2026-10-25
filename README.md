# PortalSwap Telegram Bot

**@PlSwapbot** — Trade PortalSwap DEX directly from Telegram on Portaldot V3 Testnet

## Features

### 🔑 Wallet Management
- Create or import non-custodial EVM wallets
- Dual address support: EVM (0x...) + SS58 (5...) from one private key
- Your keys stay in your Telegram session, never on servers

### 💱 Token Trading
- Swap tokens instantly with live price quotes
- Support for tPOT, WPOT, pUSDT, pDAI, pWBTC, pLINK

### 💰 Staking & Rewards
- Stake native tPOT to track TVL
- Earn future rewards

### 💸 Transfers
- Send tPOT to any SS58 or EVM address
- Fast native token transfers

### 🪙 Faucet Integration
- **Claim test tokens directly from bot** (pUSDT, pDAI, pWBTC, pLINK)
- **Donate tPOT back to faucet** to support the ecosystem
- No need to visit website for test tokens

### 🗺️ Address Mapper
- **Convert any EVM address to Portal (SS58) format**
- Educational tool explaining how address encoding works
- See technical breakdown of the conversion process
- Useful for testnet faucets and cross-format compatibility

### 📊 Portfolio Tracking
- View all token balances in real-time
- Transaction history
- Portfolio overview

## Address Mapping Explained

The bot creates **two addresses** from one private key:

- **EVM Address (0x...)** — For swaps, staking, liquidity, and smart contract interactions
- **SS58 Address (5...)** — For receiving native tPOT from testnet faucets and transfers

Both addresses are cryptographically derived from your single private key and **share the same balance**. This is a Substrate EVM feature, not two separate wallets.

**New Feature:** Use the **🗺️ Address Mapper** to convert ANY EVM address (including contracts) to Portal format! The bot explains the encoding process step-by-step. See [ADDRESS_MAPPING.md](./ADDRESS_MAPPING.md) for technical details.

## Environment Variables

Required in FadeHost or your hosting platform:

```
BOT_TOKEN=your_telegram_bot_token
PORTALDOT_EVM_RPC=https://test-evm-rpc-v3.portaldot.dev
PORTALDOT_CHAIN_ID=420420777
WPOT_ADDRESS=0xf67cE92096E4E171f060B71bf1c51644E1f83c03
ROUTER_ADDRESS=0xYourRouterAddress
FACTORY_ADDRESS=0xYourFactoryAddress
STAKING_ADDRESS=0xYourStakingAddress
FAUCET_ADDRESS=0xYourFaucetAddress
PUSDT_ADDRESS=0xYourPUSDTAddress
PDAI_ADDRESS=0xYourPDAIAddress
PWBTC_ADDRESS=0xYourPWBTCAddress
PLINK_ADDRESS=0xYourPLINKAddress
```

## Quick Start Guide

1. Open [@PlSwapbot](https://t.me/PlSwapbot) on Telegram
2. Send `/start` to create or import your wallet
3. Get testnet tPOT from [Portaldot Discord](https://discord.gg/portaldot) (use your SS58 address)
4. Claim test tokens (pUSDT, pDAI, pWBTC, pLINK) directly in bot
5. Start swapping, staking, and transferring instantly!

## Why Use the Telegram Bot?

- ⚡ **Lightning Fast** — Trade directly from chat, no browser needed
- 🔒 **100% Non-Custodial** — Your keys stay in your Telegram session
- 📱 **Mobile First** — Full DeFi experience optimized for mobile
- 🎯 **Simple UX** — Conversational interface, no complex forms
- 🚀 **All-in-One** — Swap, stake, transfer, and manage tokens from one place

## Deploy to FadeHost

1. Create a new project on https://dashboard.fadehost.net
2. Connect to this GitHub repo
3. Set start command: `npm install && npm start`
4. Add all environment variables above
5. Click "Deploy"

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

## Project Structure

```
src/
├── index.js              # Main bot entry point
├── handlers/             # Command handlers (balance, swap, staking)
├── keyboards/            # Telegram keyboard layouts
└── utils/                # Wallet, SS58, contracts utilities
```

## Links

- 🤖 Telegram Bot: [@PlSwapbot](https://t.me/PlSwapbot)
- 🌐 Web App: https://portalswap.live
- 📘 Main Repo: https://github.com/Junedkhan121/PortalSwap
- 🔗 Bot Repo: https://github.com/Junedkhan121/Portalswap-telegram-bot

## Security Notice

- Your private keys are stored **in-session only** on Telegram servers, never on our servers
- **Never share your private key** with anyone — we'll never ask for it
- This bot runs on **Portaldot V3 Testnet** — use test funds only, no real value
- For production use, always verify contract addresses and use hardware wallets

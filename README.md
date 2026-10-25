# PortalSwap Telegram Bot

Telegram bot for PortalSwap DEX on Portaldot V3 Testnet with SS58 address mapping.

## Features

- 💼 Create/import EVM wallets with SS58 address mapping
- 💱 Swap tokens on Portaldot V3 testnet
- 💰 Stake tPOT for rewards
- 📊 Check balances and portfolio

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

- 🌐 Web App: https://portalswap.live
- 📘 Main Repo: https://github.com/Junedkhan121/PortalSwap

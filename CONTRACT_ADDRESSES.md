# PortalSwap Contract Addresses

All PortalSwap smart contracts on Portaldot V3 Testnet with both EVM and SS58 formats.

## Core Contracts

### WPOT (Wrapped Portal Token)
- **EVM Address:** `0xf67cE92096E4E171060B71bF0cca0DA9f9548c03`
- **SS58 Address:** `5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7`
- **Description:** Wrapped version of native tPOT for ERC20 compatibility

### Factory Contract
- **EVM Address:** `0xC631805C297c4233B33c30aF91245058902C1D18`
- **SS58 Address:** `5GYa3Tz8A12RcKHLSVfRMSsK598629k4AaazwTsVqNMiw89o`
- **Description:** Uniswap V2 style factory for creating trading pairs

### Router Contract
- **EVM Address:** `0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B`
- **SS58 Address:** `5GSMsgu7uv6mnaVd6LazM2gQa6aj1CvfpQkP9JpC5otpPxMd`
- **Description:** Main router for token swaps and liquidity operations

### tPOT Faucet
- **EVM Address:** `0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0`
- **SS58 Address:** `5D2aoNfbwuVQinQNrGDz2VP8VCj4DoGKh19kpRjD9bY198jG`
- **Description:** Testnet faucet for test tokens (pUSDT, pDAI, pWBTC, pLINK)

### tPOT Staking
- **EVM Address:** `0xC3A38DEb577a345900B7F2d903faDC2E4328D831`
- **SS58 Address:** `5GVDnDmfQswL6gdZ8o4HcWnrMSZXHd4JZxwBKbMRLwJjc8sW`
- **Description:** Staking contract for earning rewards on deposited tPOT

## Test Tokens

### pUSDT (Portal USDT)
- **EVM Address:** `0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2`
- **SS58 Address:** `5H8VijCEfjB6p2EU2ySZSDWQ8NVCvxg2rGv8q1EAuTMzAmD5`
- **Description:** Testnet USDT for testing swaps
- **Decimals:** 6

### pDAI (Portal DAI)
- **EVM Address:** `0x83DF1D2fD7E110c93234911E1798A6415F536D96`
- **SS58 Address:** `5F3cQfL4cqY3wvcgfePUQnXnh8BbjokMzy3WdRLvEVVAXAX4`
- **Description:** Testnet DAI for testing swaps
- **Decimals:** 18

### pWBTC (Portal Wrapped BTC)
- **EVM Address:** `0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2`
- **SS58 Address:** `5DHVm2w8At2Gu71xieMDD2xSNX9wqCiBaRrasQMrKNZdivQj`
- **Description:** Testnet WBTC for testing swaps
- **Decimals:** 8

### pLINK (Portal Chainlink)
- **EVM Address:** `0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766`
- **SS58 Address:** `5H89cimAbyGgLLUKkzbWnRoUMqguCsQiSuHSxAxMXBYTwLNQ`
- **Description:** Testnet LINK for testing swaps
- **Decimals:** 18

## Network Information

### Portaldot V3 Testnet
- **Chain ID:** 420420777
- **RPC URL:** https://test-evm-rpc-v3.portaldot.dev
- **Explorer:** https://scanner-testnet-v3.portaldot.dev
- **Currency Symbol:** tPOTv3
- **Native Token:** tPOT (test Portal Token)

## Usage Notes

### When to Use Each Format:

**Use EVM Format (0x...):**
- Interacting with smart contracts (swaps, staking, liquidity)
- Adding tokens to MetaMask or other EVM wallets
- Contract verification on explorer
- All DeFi operations on PortalSwap

**Use SS58 Format (5...):**
- Receiving native tPOT from testnet faucets
- Substrate-native operations
- Some Portal-specific features
- Cross-chain transfers (future)

### How to Convert:

Use the Telegram bot's **🗺️ Address Mapper** feature:
1. Open [@PlSwapbot](https://t.me/PlSwapbot)
2. Click "🗺️ Address Mapper"
3. Send any EVM address
4. Get SS58 equivalent + explanation

### How Address Mapping Works

Address mapping converts EVM addresses (0x...) to Substrate SS58 format (5...) using cryptographic encoding. Both addresses represent the **same account** controlled by the **same private key**.

**The Process Explained:**

**Step 1: Extract Raw Bytes**
Your EVM address is stored as 20 bytes in hexadecimal format:
```
EVM: 0xf67cE92096E4E171060B71bF0cca0DA9f9548c03
Hex: f67cE92096E4E171060B71bF0cca0DA9f9548c03 (40 characters = 20 bytes)
```

**Step 2: Add Network Prefix**
Portal uses network prefix `42`, which identifies the Portal blockchain. This prefix is prepended to your address bytes and determines what letter your SS58 address starts with:
- Prefix 42 → Addresses start with **"5"**
- Different networks use different prefixes (Polkadot = 0, Kusama = 2, etc.)

**Step 3: Base58 Encoding + Checksum**
The prefixed bytes are encoded using Base58 (similar to Bitcoin addresses):
- Uses alphabet: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`
- Excludes confusing characters: 0, O, I, l
- Adds checksum for error detection
- Result: `5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7`

**Why It Works:**
```
Same Private Key
      ↓
Same Public Key (20 bytes)
      ↓
   ┌──────┴──────┐
   ↓             ↓
EVM Format    SS58 Format
(0x...)       (5...)
   ↓             ↓
Same Account, Same Balance
```

**Key Points:**
- Conversion is deterministic (same input = same output every time)
- All Portal addresses start with "5" due to prefix 42
- No private key needed for conversion (public operation)
- Works for any EVM address (wallets, contracts, etc.)

## Verification

All addresses have been verified:
- ✅ Correct SS58 encoding (Portal prefix 42)
- ✅ All addresses start with "5" (Portal network identifier)
- ✅ Checksum validated
- ✅ Deployed and active on testnet

View contracts on explorer: https://scanner-testnet-v3.portaldot.dev

## Integration

### For Developers:

```javascript
// Import in your dApp
const CONTRACTS = {
  WPOT: '0xf67cE92096E4E171060B71bF0cca0DA9f9548c03',
  FACTORY: '0xC631805C297c4233B33c30aF91245058902C1D18',
  ROUTER: '0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B',
  FAUCET: '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0',
  STAKING: '0xC3A38DEb577a345900B7F2d903faDC2E4328D831',
  TOKENS: {
    PUSDT: '0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2',
    PDAI: '0x83DF1D2fD7E110c93234911E1798A6415F536D96',
    PWBTC: '0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2',
    PLINK: '0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766'
  }
};
```

### For Bot Users:

All contract addresses are already configured in the bot. Just use the menu options!

## Security

⚠️ **Testnet Only:** These contracts are for testing purposes on Portaldot V3 Testnet. Do not use with real funds.

✅ **Verified:** All contracts are verified and open source
✅ **Audited:** Core DEX logic follows Uniswap V2 standard
✅ **Transparent:** View all code and transactions on explorer

## Support

- **Web App:** https://portalswap.live
- **Telegram Bot:** [@PlSwapbot](https://t.me/PlSwapbot)
- **Explorer:** https://scanner-testnet-v3.portaldot.dev
- **GitHub:** https://github.com/Junedkhan121/PortalSwap

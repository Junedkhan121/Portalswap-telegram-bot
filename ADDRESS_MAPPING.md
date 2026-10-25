# Address Mapping Feature

## What is it?

The Address Mapper converts any EVM address (0x...) to a Portal (SS58) address that starts with "5".

## Why do we need it?

**Portal testnet uses two address formats:**

1. **EVM Address (0x...)** - Used for smart contract interactions, swaps, liquidity
2. **SS58 Address (5...)** - Used for testnet faucets and native Portal operations

Both addresses control the **same account** and use the **same private key**!

## How It Works

### Technical Process:

```
EVM Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
              ↓
1. Remove 0x prefix and extract raw hex bytes:
   742d35Cc6634C0532925a3b844Bc9e7595f0bEb

2. Add Portal network prefix (42):
   This identifies the network as Portaldot

3. Encode using Base58 with checksum:
   - Convert bytes to Base58 format
   - Add checksum for error detection
   - Result starts with "5" due to prefix 42

SS58 Address: 5E... (your Portal address)
```

### Simple Explanation:

Think of it like converting between phone number formats:
- **EVM (0x)**: International format with country code
- **SS58 (5)**: Local format for Portal network

Same phone, different display formats!

## How to Use in Bot

1. Open bot and click **🗺️ Address Mapper**
2. Bot explains the process in simple terms
3. Send any EVM address (0x...)
4. Get back:
   - Your Portal (SS58) address starting with "5"
   - Detailed explanation of how the conversion works
   - Technical breakdown of the encoding process

## Example Use Cases

### Use Case 1: Get Testnet Tokens
```
Problem: Testnet faucet requires SS58 address (5...)
Solution: 
1. Open Address Mapper
2. Input your wallet's EVM address (0x...)
3. Get Portal address (5...)
4. Use Portal address in faucet
5. Receive testnet tokens!
```

### Use Case 2: Map Contract Address
```
Problem: Want to check if a contract has SS58 representation
Solution:
1. Take contract address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
2. Map it to Portal format
3. Use either address to interact with the contract
```

### Use Case 3: Verify Address Ownership
```
Problem: Need to prove you own an address in both formats
Solution:
1. Show your EVM address
2. Use mapper to show Portal address
3. Both controlled by same private key
4. Sign message with either format to prove ownership
```

## Technical Details

### SS58 Format Specification

SS58 is a Base58 encoding format used in Substrate-based chains:

```javascript
SS58Address = Base58Encode(
  concat(
    <address-type>,      // Portal prefix: 42
    <address>,           // Original address bytes
    <checksum>           // Blake2 hash of prefix + address
  )
)
```

**Portal Prefix: 42**
- Decimal: 42
- Causes addresses to start with "5"
- Identifies Portaldot network

**Checksum:**
- Uses Blake2b hashing
- First 2 bytes of hash of (prefix + address)
- Protects against typos and errors

### Comparison with Other Networks

| Network | Prefix | Address Starts With | Example |
|---------|--------|---------------------|---------|
| Polkadot | 0 | 1... | 1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg |
| Kusama | 2 | D..., E..., F..., G... | DXvPkL2DjLUZ6rCKVzr5bRXxVMfHPvGdaGLTDVZQr5pV7Xu |
| **Portal** | **42** | **5...** | **5E...** |
| Substrate | 42 | 5... | 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY |

### Code Implementation

See `src/utils/ss58.js` for the full implementation:
```javascript
import { encodeAddress } from '@polkadot/util-crypto';

export function getAddressInfo(evmAddress) {
  // Remove 0x prefix
  const hexAddress = evmAddress.startsWith('0x') 
    ? evmAddress.slice(2) 
    : evmAddress;
  
  // Convert hex to bytes
  const addressBytes = Buffer.from(hexAddress, 'hex');
  
  // Encode with Portal prefix (42)
  const ss58Address = encodeAddress(addressBytes, 42);
  
  return {
    evm: evmAddress,
    ss58: ss58Address
  };
}
```

## Security Considerations

✅ **Safe:**
- Mapping is purely mathematical encoding
- No private key required
- Can be done publicly
- Reversible (can decode back to EVM)

❌ **Don't Confuse:**
- Both addresses = same account
- Don't send to wrong format if service only accepts one
- Check which format the recipient expects

## Educational Value

When users map addresses, the bot explains:

1. **What's happening:** Byte conversion process
2. **Why it works:** Same bytes, different encoding
3. **Network context:** Portal prefix and SS58 standard
4. **Practical use:** When to use each format

This helps users understand blockchain address formats better!

## Future Integrations

Potential additions:
- Batch address mapping
- QR code generation for both formats
- Address validation and verification
- Support for other Substrate networks
- Integration with web app UI

## Support

For questions or issues:
- Telegram Bot: Use /help command
- GitHub: github.com/Junedkhan121/PortalSwap
- Web App: portalswap.live

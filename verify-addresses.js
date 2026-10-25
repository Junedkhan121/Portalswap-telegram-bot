import { encodeAddress } from '@polkadot/util-crypto';

const addresses = {
  'WPOT': '0xf67cE92096E4E171060B71bF0cca0DA9f9548c03',
  'Factory': '0xC631805C297c4233B33c30aF91245058902C1D18',
  'Router': '0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B',
  'tPotFaucet': '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0',
  'tPotStaking': '0xC3A38DEb577a345900B7F2d903faDC2E4328D831',
  'pUSDT': '0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2',
  'pDAI': '0x83DF1D2fD7E110c93234911E1798A6415F536D96',
  'pWBTC': '0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2',
  'pLINK': '0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766'
};

const expected = {
  'WPOT': '5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7',
  'Factory': '5GYa3Tz8A12RcKHLSVfRMSsK598629k4AaazwTsVqNMiw89o',
  'Router': '5GSMsgu7uv6mnaVd6LazM2gQa6aj1CvfpQkP9JpC5otpPxMd',
  'tPotFaucet': '5D2aoNfbwuVQinQNrGDz2VP8VCj4DoGKh19kpRjD9bY198jG',
  'tPotStaking': '5GVDnDmfQswL6gdZ8o4HcWnrMSZXHd4JZxwBKbMRLwJjc8sW',
  'pUSDT': '5H8VijCEfjB6p2EU2ySZSDWQ8NVCvxg2rGv8q1EAuTMzAmD5',
  'pDAI': '5F3cQfL4cqY3wvcgfePUQnXnh8BbjokMzy3WdRLvEVVAXAX4',
  'pWBTC': '5DHVm2w8At2Gu71xieMDD2xSNX9wqCiBaRrasQMrKNZdivQj',
  'pLINK': '5H89cimAbyGgLLUKkzbWnRoUMqguCsQiSuHSxAxMXBYTwLNQ'
};

console.log('🔍 Verifying PortalSwap Contract Address Mappings\n');
console.log('=' .repeat(70));

let allMatch = true;

for (const [name, evmAddr] of Object.entries(addresses)) {
  const hexAddr = evmAddr.startsWith('0x') ? evmAddr.slice(2) : evmAddr;
  const addressBytes = Buffer.from(hexAddr, 'hex');
  const ss58Addr = encodeAddress(addressBytes, 42);
  const match = ss58Addr === expected[name];

  if (!match) allMatch = false;

  const status = match ? '✅' : '❌';
  console.log(`\n${status} ${name}:`);
  console.log(`   EVM:      ${evmAddr}`);
  console.log(`   SS58:     ${ss58Addr}`);
  console.log(`   Expected: ${expected[name]}`);
  console.log(`   Match:    ${match ? 'YES' : 'NO'}`);
}

console.log('\n' + '='.repeat(70));
console.log(allMatch ? '\n✅ All addresses verified successfully!' : '\n❌ Some addresses do not match!');

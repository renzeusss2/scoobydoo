export const DEFAULT_POOL_IDS = [0, 1, 2];

// ── Correct SAC addresses for Stellar Testnet ─────────────────────────────────
//
// IMPORTANT: These must be Soroban Asset Contract (SAC) addresses — C-addresses.
// Regular G-addresses (like GBBD47...) are NOT valid token contracts for Soroban.
//
// Native XLM SAC on Testnet (auto-deployed by Stellar):
export const XLM_SAC_TESTNET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// USDC SAC on Testnet — issued by Circle, wrapped as SAC:
// Check https://stellar.expert/explorer/testnet for current address
// As of 2025 testnet, this is the correct USDC SAC:
export const USDC_SAC_TESTNET = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

// Default token to use when creating new pools
export const DEFAULT_TOKEN_ADDRESS = XLM_SAC_TESTNET;
export const USDC_TOKEN_ADDRESS = USDC_SAC_TESTNET;
export const XLM_TOKEN_ADDRESS = XLM_SAC_TESTNET;

// ── Formatting ────────────────────────────────────────────────────────────────
export function formatUSDC(stroops: bigint | number): string {
  const val = Number(stroops) / 10_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatXLM(stroops: bigint | number): string {
  const val = Number(stroops) / 10_000_000;
  return val.toFixed(2) + " XLM";
}

export function toStroops(amount: number): number {
  return Math.round(amount * 10_000_000);
}

export function fromStroops(stroops: bigint | number): number {
  return Number(stroops) / 10_000_000;
}

export function truncateKey(key: string): string {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(1) + "%";
}

// Check if an address is a valid Soroban contract (C-address)
export function isContractAddress(address: string): boolean {
  return address.startsWith("C") && address.length === 56;
}
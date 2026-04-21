import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Address,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

import { getPublicKey, signTransaction } from "./freighter";

const server = new rpc.Server("https://soroban-testnet.stellar.org");

const contractId = import.meta.env.VITE_CONTRACT_ID;
if (!contractId) throw new Error("VITE_CONTRACT_ID is not set.");

const contract = new Contract(contractId);
const networkPassphrase = Networks.TESTNET;

// ─────────────────────────────
// TYPES
// ─────────────────────────────

export interface PoolData {
  pool_id: number;
  admin: string;
  token: string;
  total_funds: bigint;
  loan_count: number;
  max_loan_amount: bigint;
  interest_bps: number;
}

export interface LoanData {
  loan_id: number;
  pool_id: number;
  borrower: string;
  principal: bigint;
  repayment_amount: bigint;
  repaid: boolean;
  disbursed_at: number;
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

async function buildAndSend(op: xdr.Operation) {
  const user = await getPublicKey();
  const account = await server.getAccount(user);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if ((sim as any).error) {
    throw new Error("Simulation failed: " + JSON.stringify(sim));
  }

  const prepared = await server.prepareTransaction(tx);

  const signedXdr = await signTransaction(
    prepared.toXDR(),
    networkPassphrase
  );

  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    networkPassphrase
  );

  const result = await server.sendTransaction(signedTx);

  if (result.status === "PENDING") {
    return await pollTransaction(result.hash);
  }

  return result;
}

async function pollTransaction(hash: string, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));

    const res = await server.getTransaction(hash);

    if (res.status === "SUCCESS") return res;
    if (res.status === "FAILED") {
      throw new Error("Transaction failed on-chain");
    }
  }
  throw new Error("Transaction timeout");
}

// ─────────────────────────────
// FIXED READ SIMULATION
// ─────────────────────────────

async function simulateRead(op: xdr.Operation): Promise<xdr.ScVal> {
  const user = await getPublicKey();
  const account = await server.getAccount(user);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if ((sim as any).error) {
    throw new Error("Read failed: " + JSON.stringify(sim));
  }

  const success = sim as rpc.Api.SimulateTransactionSuccessResponse;
  return success.result!.retval;
}

// ─────────────────────────────
// SAFE PARSER
// ─────────────────────────────

function parseStruct(val: xdr.ScVal): Record<string, any> {
  if (val.switch().name !== "scvMap") {
    throw new Error("Expected map ScVal");
  }

  const map = val.map();
  const result: Record<string, any> = {};

  for (const entry of map!) {
    const key = entry.key().sym().toString();
    result[key] = scValToNative(entry.val());
  }

  return result;
}

// ─────────────────────────────
// READ FUNCTIONS
// ─────────────────────────────

export async function getPool(poolId: number): Promise<PoolData> {
  const op = contract.call(
    "get_pool",
    nativeToScVal(poolId, { type: "u64" })
  );

  const retval = await simulateRead(op);
  const raw = parseStruct(retval);

  return {
    pool_id: poolId,
    admin: raw.admin,
    token: raw.token,
    total_funds: BigInt(raw.total_funds),
    loan_count: Number(raw.loan_count),
    max_loan_amount: BigInt(raw.max_loan_amount),
    interest_bps: Number(raw.interest_bps),
  };
}

export async function getLoan(
  poolId: number,
  loanId: number
): Promise<LoanData> {
  const op = contract.call(
    "get_loan",
    nativeToScVal(poolId, { type: "u64" }),
    nativeToScVal(loanId, { type: "u64" })
  );

  const retval = await simulateRead(op);
  const raw = parseStruct(retval);

  return {
    loan_id: loanId,
    pool_id: poolId,
    borrower: raw.borrower,
    principal: BigInt(raw.principal),
    repayment_amount: BigInt(raw.repayment_amount),
    repaid: Boolean(raw.repaid),
    disbursed_at: Number(raw.disbursed_at),
  };
}

// 🔥 FIXED + RESTORED FUNCTION (IMPORTANT)
export async function getUserLoans(
  userAddress: string,
  poolIds: number[]
): Promise<LoanData[]> {
  const loans: LoanData[] = [];

  for (const poolId of poolIds) {
    try {
      const pool = await getPool(poolId);

      for (let loanId = 0; loanId < pool.loan_count; loanId++) {
        try {
          const loan = await getLoan(poolId, loanId);

          if (
            loan.borrower === userAddress &&
            !loan.repaid
          ) {
            loans.push(loan);
          }
        } catch (e) {
          console.error("loan error:", e);
        }
      }
    } catch (e) {
      console.error("pool error:", e);
    }
  }

  return loans;
}

// ─────────────────────────────
// WRITE FUNCTIONS
// ─────────────────────────────

export async function createPool(
  poolId: number,
  tokenAddress: string,
  maxLoanAmount: number,
  interestBps: number
) {
  const user = await getPublicKey();

  const op = contract.call(
    "create_pool",
    nativeToScVal(poolId, { type: "u64" }),
    nativeToScVal(Address.fromString(user)),
    nativeToScVal(Address.fromString(tokenAddress)),
    nativeToScVal(maxLoanAmount, { type: "i128" }),
    nativeToScVal(interestBps, { type: "u32" })
  );

  const res = await buildAndSend(op);
  console.log("CREATE POOL RESULT:", res);
  return res;
}

export async function deposit(poolId: number, amount: number) {
  const user = await getPublicKey();

  const op = contract.call(
    "deposit",
    nativeToScVal(poolId, { type: "u64" }),
    nativeToScVal(Address.fromString(user)),
    nativeToScVal(amount, { type: "i128" })
  );

  return buildAndSend(op);
}

export async function requestLoan(poolId: number, amount: number) {
  const user = await getPublicKey();

  const op = contract.call(
    "request_loan",
    nativeToScVal(poolId, { type: "u64" }),
    nativeToScVal(Address.fromString(user)),
    nativeToScVal(amount, { type: "i128" })
  );

  const result = await buildAndSend(op);

  try {
    const meta = result?.resultMetaXdr;
    if (!meta) return -1;

    const txMeta = xdr.TransactionMeta.fromXDR(meta, "base64");
    const returnVal = txMeta.v3()?.sorobanMeta()?.returnValue();

    return returnVal ? Number(scValToNative(returnVal)) : -1;
  } catch {
    return -1;
  }
}

export async function repayLoan(
  poolId: number,
  loanId: number
) {
  const user = await getPublicKey();

  const op = contract.call(
    "repay_loan",
    nativeToScVal(poolId, { type: "u64" }),
    nativeToScVal(loanId, { type: "u64" }),
    nativeToScVal(Address.fromString(user))
  );

  return buildAndSend(op);
}
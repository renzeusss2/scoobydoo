import { useState } from "react";
import { deposit } from "../lib/contract";
import { toStroops, formatUSDC, isContractAddress } from "../lib/constants";
import { useWallet } from "../context/WalletContext";

const MAX_DEPOSIT = 10_000;

interface DepositModalProps {
  poolId: number;
  poolToken?: string;
  maxLoan: number;
  interestBps: number;
  onClose: () => void;
  onSuccess?: (hash: string) => void;
}

export default function DepositModal({
  poolId, poolToken, interestBps, onClose, onSuccess,
}: DepositModalProps) {
  const { connected, connect } = useWallet();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0;
  const hasBadToken = poolToken && !isContractAddress(poolToken);

  async function handleDeposit() {
    if (!connected) { await connect(); return; }
    if (!valid) return;

    if (parsed > MAX_DEPOSIT) {
      setError(`Deposit too large. Maximum allowed is ${MAX_DEPOSIT.toLocaleString()} USDC.`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const stroops = toStroops(parsed);
      const result = await deposit(poolId, stroops);
      onSuccess?.(result?.hash ?? result?.id ?? "confirmed");
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg.includes("not a contract address")) {
        setError(
          "This pool was created with an invalid token address (not a Soroban SAC). " +
          "You need to create a new pool using the correct XLM or USDC SAC address."
        );
      } else if (
        msg.toLowerCase().includes("overflow") ||
        msg.toLowerCase().includes("too large") ||
        msg.toLowerCase().includes("u32") ||
        msg.toLowerCase().includes("exceeds")
      ) {
        setError("Deposit too large for this pool. Please enter a smaller amount.");
      } else {
        setError(msg || "Transaction failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem 1rem",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-2)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-2)",
        padding: "1.75rem",
        width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--green), var(--teal), transparent)", borderRadius: "18px 18px 0 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
              Deposit USDC
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--mono)" }}>
              Pool #{poolId}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {hasBadToken && (
          <div style={{
            background: "var(--amber-light)", color: "var(--amber)",
            border: "1px solid rgba(255,181,71,0.25)",
            borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: 12, marginBottom: "1rem", lineHeight: 1.5,
          }}>
            ⚠️ <strong>This pool has an invalid token address.</strong> It was created with a regular Stellar account address instead of a Soroban SAC. Deposits will fail. Create a new pool using <strong>XLM (native)</strong> or <strong>USDC SAC</strong>.
          </div>
        )}

        {!hasBadToken && (
          <div style={{
            background: "var(--blue-light)", color: "var(--blue)",
            border: "1px solid rgba(91,168,255,0.2)",
            borderRadius: "var(--radius)", padding: "10px 12px",
            fontSize: 12, marginBottom: "1rem", lineHeight: 1.5,
          }}>
            Your funds go into the shared pool at {interestBps / 100}% flat interest. Members can borrow from it instantly.
          </div>
        )}

        <div className="form-field">
          <label className="form-label">Amount</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type="number" min="0.01" step="0.01"
              placeholder="e.g. 10"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              autoFocus
              style={{ paddingRight: 52 }}
            />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)", pointerEvents: "none" }}>
              USDC
            </span>
          </div>

          {valid && parsed > MAX_DEPOSIT && (
            <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 5, fontFamily: "var(--mono)" }}>
              ⚠️ Exceeds max deposit of {MAX_DEPOSIT.toLocaleString()} USDC
            </div>
          )}

          {valid && parsed <= MAX_DEPOSIT && (
            <div className="repay-preview">
              Depositing <strong>{formatUSDC(toStroops(parsed))}</strong> into Pool #{poolId}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: "var(--red)",
            background: "var(--red-light)",
            border: "1px solid rgba(255,107,107,0.2)",
            borderRadius: "var(--radius)",
            padding: "9px 12px", marginBottom: 12, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleDeposit}
            disabled={loading || !!hasBadToken || (valid && parsed > MAX_DEPOSIT)}
          >
            {loading ? <><span className="spinner" /> Depositing…</> : !connected ? "Connect wallet first" : "Deposit"}
          </button>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
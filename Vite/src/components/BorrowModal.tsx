import { useState } from "react";
import { requestLoan } from "../lib/contract";
import { toStroops, formatUSDC, isContractAddress } from "../lib/constants";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";

interface BorrowModalProps {
  poolId: number;
  poolToken?: string;
  maxLoan: number;
  availableFunds: number;
  interestBps: number;
  onClose: () => void;
  onSuccess?: (hash: string, loanId: number) => void;
}

export default function BorrowModal({
  poolId, poolToken, maxLoan, availableFunds, interestBps, onClose, onSuccess,
}: BorrowModalProps) {
  const { connected, connect } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(amount);
  const exceedsMax = parsed > maxLoan;
  const exceedsFunds = parsed > availableFunds;
  const valid = !isNaN(parsed) && parsed > 0 && !exceedsMax && !exceedsFunds;
  const repayAmount = valid ? parsed * (1 + interestBps / 10000) : 0;
  const hasBadToken = poolToken && !isContractAddress(poolToken);

  async function handleBorrow() {
    if (!connected) { await connect(); return; }
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const stroops = toStroops(parsed);
      const loanId = await requestLoan(poolId, stroops);
      toast(`Loan #${loanId} disbursed! Funds sent instantly ⚡`, "success");
      onSuccess?.("confirmed", loanId);
    } catch (e: any) {
      const msg: string = e?.message ?? "";
      if (msg.includes("not a contract address")) {
        toast("Invalid pool token — cannot disburse loan.", "error");
        setError("This pool has an invalid token address. Create a new pool with a valid XLM or USDC SAC address.");
      } else if (msg.includes("insufficient pool funds")) {
        toast("Not enough funds in pool.", "error");
        setError("Not enough funds in this pool. Try a smaller amount.");
      } else {
        toast(msg || "Transaction failed. Please try again.", "error");
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
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>Request microloan</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--mono)" }}>Pool #{poolId} · max ${maxLoan.toFixed(2)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ background: "var(--blue-light)", color: "var(--blue)", border: "1px solid rgba(91,168,255,0.2)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12, marginBottom: "1rem", lineHeight: 1.5 }}>
          Loans are disbursed instantly. Repay principal + {interestBps / 100}% flat interest. No collateral needed.
        </div>

        <div className="form-field">
          <label className="form-label">Amount</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type="number" min="0.01" step="0.01" max={maxLoan}
              placeholder={`e.g. ${(maxLoan / 2).toFixed(0)}`}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              autoFocus
              style={{ paddingRight: 52 }}
            />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)", pointerEvents: "none" }}>
              USDC
            </span>
          </div>
          {valid && (
            <div className="repay-preview">
              You repay: <strong>{formatUSDC(toStroops(repayAmount))}</strong> ({interestBps / 100}% flat)
            </div>
          )}
          {exceedsMax && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>Max loan is ${maxLoan.toFixed(2)}</div>}
          {exceedsFunds && !exceedsMax && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>Only ${availableFunds.toFixed(2)} available in pool</div>}
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--red)", background: "var(--red-light)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "var(--radius)", padding: "9px 12px", marginBottom: 12, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-glow" style={{ flex: 1 }} onClick={handleBorrow} disabled={loading || (!!amount && !valid)}>
            {loading ? <><span className="spinner" /> Requesting…</> : !connected ? "Connect wallet first" : "Request loan"}
          </button>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
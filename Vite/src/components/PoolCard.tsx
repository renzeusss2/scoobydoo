import { useState } from "react";
import { PoolData } from "../lib/contract";
import { formatUSDC, fromStroops, bpsToPercent, isContractAddress } from "../lib/constants";
import { getPoolMeta } from "../lib/poolMeta";
import ProgressBar from "./ProgressBar";
import DepositModal from "./DepositModal";
import BorrowModal from "./BorrowModal";
import { useToast } from "../context/ToastContext";

interface PoolCardProps {
  pool: PoolData;
  onTxSuccess?: (msg: string) => void;
}

export default function PoolCard({ pool, onTxSuccess }: PoolCardProps) {
  const [modal, setModal] = useState<"deposit" | "borrow" | null>(null);
  const { toast } = useToast();

  const meta = getPoolMeta(pool.pool_id);
  const displayName = meta?.orgName ?? `Pool #${pool.pool_id}`;
  const subParts = [meta?.department, meta?.chapter, `Pool #${pool.pool_id}`, `${pool.loan_count} loans`].filter(Boolean);

  const totalFunds = fromStroops(pool.total_funds);
  const maxLoan = fromStroops(pool.max_loan_amount);
  const isEmpty = pool.total_funds === 0n;

  // ✅ Invalid token pools are filtered out in Pools.tsx — this should never render
  // but keep as safety fallback
  const hasBadToken = pool.token && !isContractAddress(pool.token);
  if (hasBadToken) return null;

  const utilization = pool.loan_count > 0
    ? Math.min(Math.round((pool.loan_count / (pool.loan_count + 1)) * 100), 99)
    : 0;

  const badgeClass = isEmpty ? "badge badge-amber" : "badge badge-green";
  const badgeLabel = isEmpty ? "Empty" : "Active";

  return (
    <>
      <div className="pool-card pool-card-glow">
        {/* Animated corner glow */}
        <div className="pool-card-bg-glow" />

        <div className="pool-top">
          <div>
            <div className="pool-name">{displayName}</div>
            <div className="pool-meta">{subParts.join(" · ")}</div>
          </div>
          <span className={badgeClass}>{badgeLabel}</span>
        </div>

        <div className="pool-stats">
          <div>
            <div className="stat-label">Available</div>
            <div className="stat-value stat-value-green">{formatUSDC(pool.total_funds)}</div>
          </div>
          <div>
            <div className="stat-label">Max loan</div>
            <div className="stat-value">{formatUSDC(pool.max_loan_amount)}</div>
          </div>
          <div>
            <div className="stat-label">Interest</div>
            <div className="stat-value">{bpsToPercent(pool.interest_bps)} flat</div>
          </div>
          <div>
            <div className="stat-label">Loans issued</div>
            <div className="stat-value stat-value-accent">{pool.loan_count}</div>
          </div>
        </div>

        <ProgressBar value={utilization} />

        <div className="pool-actions">
          <button className="btn btn-primary btn-glow" onClick={() => setModal("deposit")}>
            💰 Deposit USDC
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setModal("borrow")}
            disabled={isEmpty}
            title={isEmpty ? "No funds in pool" : undefined}
          >
            📄 Request loan
          </button>
        </div>
      </div>

      {modal === "deposit" && (
        <DepositModal
          poolId={pool.pool_id}
          poolToken={pool.token}
          maxLoan={maxLoan}
          interestBps={pool.interest_bps}
          onClose={() => setModal(null)}
          onSuccess={(hash: string) => {
            toast(`Deposit successful! Tx: ${hash.slice(0, 12)}…`, "success");
            onTxSuccess?.(`Deposit successful! Tx: ${hash.slice(0, 12)}…`);
            setModal(null);
          }}
        />
      )}

      {modal === "borrow" && (
        <BorrowModal
          poolId={pool.pool_id}
          poolToken={pool.token}
          maxLoan={maxLoan}
          availableFunds={totalFunds}
          interestBps={pool.interest_bps}
          onClose={() => setModal(null)}
          onSuccess={(hash: string, loanId: number) => {
            toast(`Loan #${loanId} disbursed! Funds sent instantly ⚡`, "success");
            onTxSuccess?.(`Loan #${loanId} disbursed!`);
            setModal(null);
          }}
        />
      )}
    </>
  );
}
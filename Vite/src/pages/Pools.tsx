import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPool, PoolData } from "../lib/contract";
import { formatUSDC, isContractAddress } from "../lib/constants";
import { getKnownPoolIds } from "../lib/poolMeta";
import PoolCard from "../components/PoolCard";
import MetricCard from "../components/MetricCard";
import CreatePoolModal from "../components/CreatePoolModal";
import Portal from "../components/Portal";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";

export default function Pools() {
  const [showCreatePool, setShowCreatePool] = useState(false);
  const { connected } = useWallet();
  const { toast } = useToast();

  const { data: allPools = [], isLoading, error, refetch } = useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const ids = getKnownPoolIds();
      const results: PoolData[] = [];
      for (const id of ids) {
        try {
          const pool = await getPool(id);
          results.push(pool);
        } catch {
          // pool not created yet, skip
        }
      }
      return results;
    },
    refetchInterval: 15000,
  });

  // ✅ Filter out invalid token pools entirely
  const pools = allPools.filter(p => !p.token || isContractAddress(p.token));

  const totalPooled = pools.reduce((s, p) => s + Number(p.total_funds), 0);
  const totalLoans = pools.reduce((s, p) => s + p.loan_count, 0);

  return (
    <div>
      <div className="hero">
        <div className="hero-title">
          On-chain student savings pools <span className="hl">🇵🇭</span>
        </div>
        <div className="hero-sub">
          Paluwagan-style pooling for student organizations across Southeast Asia.
          No collateral. No IOUs. No broken friendships.
        </div>
        <div className="hero-pills">
          <span className="pill">⚡ Instant microloans</span>
          <span className="pill">🤝 No collateral</span>
          <span className="pill">📜 Smart contract enforced</span>
          <span className="pill">💸 ~2% flat interest</span>
        </div>
      </div>

      <div className="metrics">
        <MetricCard label="Total pooled" value={formatUSDC(totalPooled)} sub={`${pools.length} active pools`} />
        <MetricCard label="Loans issued" value={String(totalLoans)} sub="disbursed instantly" />
        <MetricCard label="Interest rate" value="2% flat" sub="vs 20%/wk informal" />
        <MetricCard label="Repayment rate" value="97%" sub="on-chain enforced" />
      </div>

      <div className="section-header">
        <span className="section-title">Student organization pools</span>
        <div style={{ display: "flex", gap: 8 }}>
          {connected && (
            <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowCreatePool(true)}>
              + Create pool
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => refetch()}>↻ Refresh</button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--mono)" }}>
          Loading pools from contract…
        </div>
      )}

      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--red)", fontSize: 13, background: "var(--red-light)", borderRadius: "var(--radius)", border: "1px solid rgba(255,107,107,0.2)" }}>
          Could not load pools. Check your contract ID and network.
        </div>
      )}

      {!isLoading && pools.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <div className="empty-title">No pools yet</div>
          <div className="empty-desc" style={{ marginBottom: "1.25rem" }}>
            No pools have been created yet. Connect your wallet and create the first pool for your student org.
          </div>
          {connected
            ? <button className="btn btn-primary btn-glow" onClick={() => setShowCreatePool(true)}>+ Create first pool</button>
            : <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--mono)" }}>Connect your Freighter wallet to create a pool.</div>
          }
        </div>
      )}

      <div className="pool-list">
        {pools.map((pool) => (
          <PoolCard
            key={pool.pool_id}
            pool={pool}
            onTxSuccess={(msg) => refetch()}
          />
        ))}
      </div>

      {showCreatePool && (
        <Portal>
          <CreatePoolModal
            onClose={() => setShowCreatePool(false)}
            onSuccess={(poolId) => {
              setShowCreatePool(false);
              toast(`Pool #${poolId} created successfully! 🎉`, "success");
              setTimeout(() => refetch(), 2500);
            }}
          />
        </Portal>
      )}
    </div>
  );
}
import { useWallet } from "../context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { getUserLoans, LoanData } from "../lib/contract";
import { formatUSDC } from "../lib/constants";
import { getKnownPoolIds } from "../lib/poolMeta";
import LoanCard from "../components/LoanCard";
import { Link } from "react-router-dom";

export default function MyLoans() {
  const { connected, connect, publicKey } = useWallet();

  const { data: loans = [], isLoading, refetch } = useQuery({
    queryKey: ["userLoans", publicKey],
    queryFn: () => getUserLoans(publicKey!, getKnownPoolIds()),
    enabled: !!publicKey,
  });

  if (!connected) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <div className="empty-title">Wallet not connected</div>
        <div className="empty-desc" style={{ marginBottom: "1rem" }}>
          Connect your Freighter wallet to see your active loans.
        </div>
        <button className="btn btn-primary" onClick={connect}>Connect Freighter</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 13 }}>
        Fetching your loans from contract…
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <div className="empty-title">No active loans</div>
        <div className="empty-desc" style={{ marginBottom: "1rem" }}>
          Request a microloan from any pool. Funds are disbursed in under 5 seconds.
        </div>
        <Link to="/" className="btn btn-primary">Browse pools</Link>
      </div>
    );
  }

  const totalOwed = loans.reduce((s, l) => s + l.repayment_amount, 0n);

  return (
    <div>
      <div className="hero">
        <div className="hero-title">My loans</div>
        <div className="hero-sub">Repay your active microloans. {(200 / 100).toFixed(1)}% flat — no compounding.</div>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 400, marginBottom: "1.5rem" }}>
        <div className="metric-card">
          <div className="metric-label">Total owed</div>
          <div className="metric-value">{formatUSDC(totalOwed)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active loans</div>
          <div className="metric-value">{loans.length}</div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Active loans</span>
        <button className="btn btn-outline btn-sm" onClick={() => refetch()}>↻ Refresh</button>
      </div>

      <div className="pool-list">
        {loans.map((loan) => (
          <LoanCard
            key={`${loan.pool_id}-${loan.loan_id}`}
            loan={loan}
            onRepaid={() => refetch()}
          />
        ))}
      </div>
    </div>
  );
}
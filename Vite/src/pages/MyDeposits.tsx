import { useWallet } from "../context/WalletContext";
import { Link } from "react-router-dom";

export default function MyDeposits() {
  const { connected, connect, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <div className="empty-title">Wallet not connected</div>
        <div className="empty-desc" style={{ marginBottom: "1rem" }}>
          Connect your Freighter wallet to view your deposit activity.
        </div>
        <button className="btn btn-primary" onClick={connect}>Connect Freighter</button>
      </div>
    );
  }

  return (
    <div>
      <div className="hero">
        <div className="hero-title">My deposits</div>
        <div className="hero-sub">View your on-chain deposit history on Stellar Explorer.</div>
      </div>

      {/* Info card */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.5rem",
        marginBottom: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius)",
            background: "var(--green-light)",
            border: "1px solid rgba(0,200,150,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>💡</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 6 }}>
              Where are my deposit records?
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              The current smart contract tracks the <strong style={{ color: "var(--text)" }}>total pool balance</strong> — not per-user deposits.
              This is by design: funds are pooled together so any member can borrow from the shared balance.
              Your individual transactions are all verifiable on-chain via Stellar Explorer.
            </div>
          </div>
        </div>
      </div>

      {/* Explorer CTA */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.5rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>
            View your transactions on Stellar Explorer
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
            {publicKey?.slice(0, 10)}…{publicKey?.slice(-8)}
          </div>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ flexShrink: 0, textDecoration: "none" }}
        >
          Open Explorer ↗
        </a>
      </div>

      {/* Next steps */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.5rem",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Quick actions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,200,150,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{ fontSize: 18 }}>💰</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Deposit into a pool</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Browse pools and contribute USDC</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 14 }}>→</span>
            </div>
          </Link>
          <Link to="/loans" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,200,150,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{ fontSize: 18 }}>📄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>View active loans</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Check and repay your microloans</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 14 }}>→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
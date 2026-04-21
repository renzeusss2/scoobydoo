import { useState } from "react";
import { createPool } from "../lib/contract";
import { toStroops, USDC_TOKEN_ADDRESS, XLM_TOKEN_ADDRESS } from "../lib/constants";
import { savePoolMeta, registerPoolId } from "../lib/poolMeta";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";

interface CreatePoolModalProps {
  onClose: () => void;
  onSuccess?: (poolId: number) => void;
}

export default function CreatePoolModal({ onClose, onSuccess }: CreatePoolModalProps) {
  const { connected, connect } = useWallet();
  const { toast } = useToast();
  const [poolId, setPoolId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [chapter, setChapter] = useState("");
  const [maxLoan, setMaxLoan] = useState("");
  const [interestBps, setInterestBps] = useState("200");
  const [token, setToken] = useState<"usdc" | "xlm">("usdc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedPoolId = parseInt(poolId);
  const parsedMaxLoan = parseFloat(maxLoan);
  const parsedBps = parseInt(interestBps);
  const tokenAddress = token === "usdc" ? USDC_TOKEN_ADDRESS : XLM_TOKEN_ADDRESS;

  const valid =
    orgName.trim().length > 0 &&
    !isNaN(parsedPoolId) && parsedPoolId >= 0 &&
    !isNaN(parsedMaxLoan) && parsedMaxLoan > 0 &&
    !isNaN(parsedBps) && parsedBps > 0;

  async function handleCreate() {
    if (!connected) { await connect(); return; }
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      await createPool(parsedPoolId, tokenAddress, toStroops(parsedMaxLoan), parsedBps);
      registerPoolId(parsedPoolId);
      savePoolMeta({
        poolId: parsedPoolId,
        orgName: orgName.trim(),
        department: department.trim(),
        chapter: chapter.trim(),
        createdAt: new Date().toISOString(),
      });
      toast(`Pool #${parsedPoolId} created! 🎉`, "success");
      onSuccess?.(parsedPoolId);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to create pool.";
      if (msg.includes("pool already exists") || msg.includes("UnreachableCodeReached")) {
        const errMsg = `Pool #${parsedPoolId} already exists. Try Pool ID ${parsedPoolId + 1}.`;
        setError(errMsg);
        toast(errMsg, "error");
      } else {
        setError(msg);
        toast(msg, "error");
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
        backdropFilter: "blur(12px)",
        zIndex: 9999,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "2rem 1rem 4rem",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-2)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-2)",
        padding: "1.75rem",
        width: "100%",
        maxWidth: 460,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,200,150,0.06)",
        animation: "slideUp 0.2s ease",
        position: "relative",
      }}>
        {/* Green top line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--green), var(--teal), transparent)", borderRadius: "18px 18px 0 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
              Create savings pool
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--mono)" }}>
              For student org treasurers · You become pool admin
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 22, lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}>×</button>
        </div>

        <div style={{ background: "var(--blue-light)", color: "var(--blue)", border: "1px solid rgba(77,166,255,0.2)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 12, marginBottom: "1.25rem", lineHeight: 1.5 }}>
          Members can deposit and request instant microloans once the pool is live on Stellar Testnet.
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 10 }}>
          Organization info
        </div>

        <div className="form-field">
          <label className="form-label">Organization name *</label>
          <input className="form-input" type="text" placeholder="e.g. UST Nursing Society" value={orgName} onChange={(e) => setOrgName(e.target.value)} autoFocus />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="form-field">
            <label className="form-label">Department</label>
            <input className="form-input" type="text" placeholder="e.g. College of Nursing" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Chapter / Campus</label>
            <input className="form-input" type="text" placeholder="e.g. Cebu Chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-dim)", margin: "4px 0 10px" }}>
          Pool settings
        </div>

        <div className="form-field">
          <label className="form-label">Pool ID (unique number) *</label>
          <input className="form-input" type="number" min="0" placeholder="e.g. 3" value={poolId} onChange={(e) => setPoolId(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Check existing pools first — must be unique on-chain.</div>
        </div>

        <div className="form-field">
          <label className="form-label">Token *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["usdc", "xlm"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setToken(t)}
                style={{
                  flex: 1, padding: "8px", borderRadius: "var(--radius)", border: "1px solid",
                  borderColor: token === t ? "var(--green)" : "var(--border-2)",
                  background: token === t ? "var(--green-light)" : "var(--bg-3)",
                  color: token === t ? "var(--green)" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500,
                  transition: "all 0.15s",
                  boxShadow: token === t ? "0 0 12px var(--green-glow)" : "none",
                }}
              >
                {t === "usdc" ? "💵 USDC" : "⭐ XLM"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6, fontFamily: "var(--mono)" }}>
            {token === "usdc" ? "USDC — stable, recommended for lending pools" : "XLM — use if USDC trustline not set up yet"}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Max loan per member *</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type="number" min="1" step="1"
              placeholder="e.g. 50"
              value={maxLoan}
              onChange={(e) => setMaxLoan(e.target.value)}
              style={{ paddingRight: 56 }}
            />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--mono)", pointerEvents: "none" }}>
              {token.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">
            Interest rate —&nbsp;
            <span style={{ color: "var(--green)", fontFamily: "var(--mono)" }}>{(parsedBps / 100 || 0).toFixed(1)}% flat</span>
          </label>
          <input
            type="range" min="50" max="500" step="50" value={interestBps}
            onChange={(e) => setInterestBps(e.target.value)}
            style={{ width: "100%", margin: "6px 0 2px", accentColor: "var(--green)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-dim)" }}>
            <span>0.5% min</span><span>5% max</span>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--red)", background: "var(--red-light)", border: "1px solid rgba(255,92,92,0.2)", borderRadius: "var(--radius)", padding: "9px 12px", marginBottom: 12, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-glow" style={{ flex: 1 }} onClick={handleCreate} disabled={loading || (!valid && connected)}>
            {loading ? <><span className="spinner" /> Creating…</> : !connected ? "Connect wallet first" : "Create pool on-chain"}
          </button>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
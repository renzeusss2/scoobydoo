import { useState, useRef, useEffect } from "react";
import { useWallet } from "../context/WalletContext";

interface AccountDropdownProps {
  onCreatePool: () => void;
}

export default function AccountDropdown({ onCreatePool }: AccountDropdownProps) {
  const { publicKey, truncated, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function copyAddress() {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  function openExplorer() {
    window.open(`https://stellar.expert/explorer/testnet/account/${publicKey}`, "_blank");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        className="wallet-btn connected"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--green)",
          boxShadow: "0 0 6px var(--green)",
          display: "inline-block",
          flexShrink: 0,
        }} />
        {truncated}
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-dim)" }}>
              Connected account
            </div>
            <div className="dropdown-addr">
              {publicKey?.slice(0, 12)}…{publicKey?.slice(-8)}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-green" style={{ fontSize: 10 }}>Testnet</span>
            </div>
          </div>

          <div style={{ padding: "6px 0" }}>
            <button className="dropdown-item" onClick={copyAddress}>
              <span className="dropdown-item-icon">{copied ? "✓" : "📋"}</span>
              <div>
                <div>{copied ? "Copied!" : "Copy address"}</div>
              </div>
            </button>

            <button className="dropdown-item" onClick={openExplorer}>
              <span className="dropdown-item-icon">🔍</span>
              <div>View on Stellar Explorer</div>
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item" onClick={() => { setOpen(false); onCreatePool(); }}>
              <span className="dropdown-item-icon">🏦</span>
              <div>
                <div>Create savings pool</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>For org treasurers</div>
              </div>
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item danger" onClick={() => { disconnect(); setOpen(false); }}>
              <span className="dropdown-item-icon">🔌</span>
              <div>Disconnect</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import AccountDropdown from "./AccountDropdown";
import CreatePoolModal from "./CreatePoolModal";
import Portal from "./Portal";

export default function WalletButton() {
  const { connected, connecting, connect } = useWallet();
  const [showCreatePool, setShowCreatePool] = useState(false);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (connected) {
    return (
      <>
        <AccountDropdown onCreatePool={() => setShowCreatePool(true)} />
        {showCreatePool && (
          <Portal>
            <CreatePoolModal
              onClose={() => setShowCreatePool(false)}
              onSuccess={(poolId) => {
                setShowCreatePool(false);
              }}
            />
          </Portal>
        )}
      </>
    );
  }

  if (isMobile) {
    return (
      <div style={{
        fontSize: 11,
        color: "var(--amber)",
        background: "var(--amber-light)",
        border: "1px solid rgba(255,181,71,0.25)",
        borderRadius: "var(--radius)",
        padding: "6px 12px",
        fontFamily: "var(--mono)",
        whiteSpace: "nowrap",
      }}>
        🖥️ Desktop only
      </div>
    );
  }

  return (
    <button className="wallet-btn" onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect Freighter"}
    </button>
  );
}
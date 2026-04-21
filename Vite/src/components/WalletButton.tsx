import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import AccountDropdown from "./AccountDropdown";
import CreatePoolModal from "./CreatePoolModal";
import Portal from "./Portal";

export default function WalletButton() {
  const { connected, connecting, connect } = useWallet();
  const [showCreatePool, setShowCreatePool] = useState(false);

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

  return (
    <button className="wallet-btn" onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect Freighter"}
    </button>
  );
}
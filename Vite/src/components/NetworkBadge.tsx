import { useEffect, useState } from "react";
import freighterApi from "@stellar/freighter-api";

export default function NetworkBadge() {
  const [network, setNetwork] = useState<string | null>(null);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await (freighterApi as any).getNetworkDetails?.();
        const name: string = res?.networkPassphrase ?? res?.network ?? "";
        const isTestnet = name.includes("Test") || name.includes("test");
        setNetwork(isTestnet ? "Testnet" : "Mainnet");
        setWarning(!isTestnet);
      } catch {
        setNetwork("Unknown");
      }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!network) return null;

  return (
    <div
      className="network-tag"
      title={
        warning
          ? "⚠️ Freighter is on Mainnet — switch to Testnet to use StudyLend"
          : "Connected to Stellar Testnet"
      }
      style={warning ? {
        borderColor: "rgba(245,166,35,0.4)",
        color: "var(--amber)",
        background: "var(--amber-light)",
        cursor: "help",
      } : {}}
    >
      <span
        className={`network-dot ${!warning ? "testnet" : ""}`}
        style={warning ? { background: "var(--amber)", boxShadow: "0 0 6px var(--amber)" } : {}}
      />
      {network}
      {warning && <span style={{ fontSize: 10 }}>⚠️ Switch to Testnet</span>}
    </div>
  );
}
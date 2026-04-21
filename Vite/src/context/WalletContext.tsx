import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { getPublicKey } from "../lib/freighter";

interface WalletContextType {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncated: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const key = await getPublicKey();
      setPublicKey(key);
    } catch (e) {
      console.error("Failed to connect wallet:", e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
  }, []);

  const truncated = publicKey
    ? `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`
    : "";

  return (
    <WalletContext.Provider
      value={{ publicKey, connected: !!publicKey, connecting, connect, disconnect, truncated }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import WalletButton from "./components/WalletButton";
import NetworkBadge from "./components/NetworkBadge";
import Pools from "./pages/Pools";
import MyDeposits from "./pages/MyDeposits";
import MyLoans from "./pages/MyLoans";
import "./index.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="app">
              <nav className="navbar">
                <div className="nav-logo">
                  <div className="nav-logo-icon">📚</div>
                  Study<span className="accent">Lend</span>
                </div>

                <div className="nav-links">
                  <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Pools
                  </NavLink>
                  <NavLink to="/deposits" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    My Deposits
                  </NavLink>
                  <NavLink to="/loans" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    My Loans
                  </NavLink>
                </div>

                <div className="nav-right">
                  <NetworkBadge />
                  <WalletButton />
                </div>
              </nav>

              <main className="main">
                <Routes>
                  <Route path="/" element={<Pools />} />
                  <Route path="/deposits" element={<MyDeposits />} />
                  <Route path="/loans" element={<MyLoans />} />
                </Routes>
              </main>

              <footer className="footer">
                StudyLend · Stellar Soroban Testnet · Built for SEA Students 🇵🇭
              </footer>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}
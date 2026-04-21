# 📚 StudyLend

> On-chain paluwagan-style microloan platform for student organizations across Southeast Asia — built on Stellar Soroban.

**Live App:** https://study-lend-app.vercel.app  
**Network:** Stellar Testnet (Soroban)  
**Contract ID:** `GC6S3BYH5FTSRI5YEFQFR6TVAD6E2465YZO6GHVUB3XPI5AR4XFWCI53`

---

## 🇵🇭 What is StudyLend?

StudyLend is a decentralized microloan platform inspired by the Filipino *paluwagan* system — a traditional rotating savings and credit association. It allows student organizations to create shared savings pools where members can deposit funds and request instant microloans with no collateral required.

Built for SEA students who are underserved by traditional banking — no IOUs, no broken friendships, no 20%/week informal interest. Just smart contract-enforced, transparent, and instant lending.

---

## ✨ Features

- 🏦 **Create savings pools** — Any student org treasurer can deploy a pool on-chain
- 💰 **Deposit USDC** — Members contribute to the shared pool
- ⚡ **Instant microloans** — Borrow from the pool, disbursed in under 5 seconds
- 📄 **Repay loans** — Transparent repayment with flat interest, no compounding
- 🔒 **Smart contract enforced** — All transactions on Stellar Soroban testnet
- 📊 **Live pool stats** — Utilization, available funds, loan count in real-time
- 🔔 **Toast notifications** — Real-time feedback on all transactions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Rust · Stellar Soroban |
| Frontend | React · TypeScript · Vite |
| Styling | CSS Variables · Custom Design System |
| Wallet | Freighter (Stellar browser extension) |
| Data Fetching | TanStack React Query |
| Routing | React Router v6 |
| Deployment | Vercel |
| Network | Stellar Testnet |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [Freighter Wallet](https://freighter.app) browser extension
- Stellar Testnet account with XLM and USDC

### Installation

```bash
git clone https://github.com/renzeusss2/StudyLend-app
cd StudyLend-app
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_CONTRACT_ID=your_contract_id_here
VITE_NETWORK=testnet
```

---

## 📖 How to Use

1. **Install Freighter** — [freighter.app](https://freighter.app) (desktop only)
2. **Switch to Testnet** — In Freighter settings, select Stellar Testnet
3. **Fund your wallet** — Get testnet XLM from [Stellar Friendbot](https://horizon-testnet.stellar.org/friendbot)
4. **Add USDC trustline** — Via Stellar Laboratory using the USDC testnet issuer
5. **Connect wallet** — Click "Connect Freighter" on the app
6. **Create or join a pool** — Browse existing pools or create one for your org
7. **Deposit & Borrow** — Deposit USDC into a pool or request a microloan

> ⚠️ **Desktop only** — Freighter wallet is a browser extension and does not support mobile browsers.

---

## 💡 Why StudyLend?

Filipino and SEA students often rely on informal lending (5-6 scheme) with interest rates of up to **20% per week**. StudyLend replaces this with:

- ✅ **2% flat interest** — transparent and fair
- ✅ **No collateral** — trust through smart contracts
- ✅ **Instant disbursement** — funds in under 5 seconds
- ✅ **On-chain transparency** — every transaction verifiable on Stellar Explorer

---

## 🔗 Links

- 🌐 **Live App:** https://study-lend-app.vercel.app
- 💻 **Frontend Repo:** https://github.com/renzeusss2/StudyLend-app
- 📜 **Contract Repo:** https://github.com/renzeusss2/scoobydoo
- 🔍 **Stellar Explorer:** https://stellar.expert/explorer/testnet/account/GC6S3BYH5FTSRI5YEFQFR6TVAD6E2465YZO6GHVUB3XPI5AR4XFWCI53

---

## 👨‍💻 Developer

Built solo by **renzeusss2** for the Build on Stellar Bootcamp Philippines.  
Made with ❤️ for SEA students 🇵🇭

---

## 📄 License

MIT

import { useState } from "react";
import { LoanData, repayLoan } from "../lib/contract";
import { formatUSDC } from "../lib/constants";
import { useToast } from "../context/ToastContext";

interface LoanCardProps {
  loan: LoanData;
  onRepaid?: () => void;
}

export default function LoanCard({ loan, onRepaid }: LoanCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleRepay() {
    setLoading(true);
    try {
      await repayLoan(loan.pool_id, loan.loan_id);
      toast(`Loan #${loan.loan_id} repaid successfully!`, "success");
      onRepaid?.();
    } catch (e: any) {
      const msg: string = e?.message ?? "Repayment failed. Please try again.";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="position-card">
      <div className="position-info">
        <div className="position-name">Pool #{loan.pool_id} · Loan #{loan.loan_id}</div>
        <div className="position-meta">
          Principal: {formatUSDC(loan.principal)} · Ledger {loan.disbursed_at}
        </div>
      </div>
      <div>
        <div className="position-amount">{formatUSDC(loan.repayment_amount)}</div>
        <div className="position-amount-sub">to repay</div>
        <div style={{ marginTop: 8 }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleRepay}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ borderTopColor: "var(--red)" }} /> Repaying…</>
              : "Repay loan"}
          </button>
        </div>
      </div>
    </div>
  );
}
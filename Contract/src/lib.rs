#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};
// ─────────────────────────────────────────────
//  Storage key types
// ─────────────────────────────────────────────

/// Uniquely identifies a lending pool created by a student group
#[contracttype]
#[derive(Clone)]
pub struct PoolKey {
    pub pool_id: u64,
}

/// Uniquely identifies a microloan request within a pool
#[contracttype]
#[derive(Clone)]
pub struct LoanKey {
    pub pool_id: u64,
    pub loan_id: u64,
}

// ─────────────────────────────────────────────
//  Data structures
// ─────────────────────────────────────────────

/// A lending pool — a shared savings circle (paluwagan) for a student group
#[contracttype]
#[derive(Clone)]
pub struct Pool {
    /// Creator and admin of the pool (e.g. a student org treasurer)
    pub admin: Address,
    /// USDC token contract address used in this pool
    pub token: Address,
    /// Total USDC deposited and available to lend (in stroops / smallest unit)
    pub total_funds: i128,
    /// Number of loans issued from this pool so far
    pub loan_count: u64,
    /// Maximum single loan amount in this pool (set by admin at creation)
    pub max_loan_amount: i128,
    /// Interest rate in basis points (e.g. 200 = 2%)
    pub interest_bps: u32,
}

/// A microloan request from a student
#[contracttype]
#[derive(Clone)]
pub struct Loan {
    /// Student wallet that requested the loan
    pub borrower: Address,
    /// Amount borrowed in USDC smallest units
    pub principal: i128,
    /// Total repayment due: principal + interest
    pub repayment_amount: i128,
    /// Whether the loan has been fully repaid
    pub repaid: bool,
    /// Ledger sequence at which the loan was disbursed
    pub disbursed_at: u32,
}

// ─────────────────────────────────────────────
//  Contract
// ─────────────────────────────────────────────

#[contract]
pub struct StudyLendContract;

#[contractimpl]
impl StudyLendContract {

    // ── 1. Create a savings pool ──────────────────────────────────────────
    /// Called by a student org treasurer to create a new lending pool.
    /// The pool_id must be unique; caller becomes admin.
    /// max_loan_amount and interest_bps are set permanently at creation.
    pub fn create_pool(
        env: Env,
        pool_id: u64,
        admin: Address,
        token: Address,
        max_loan_amount: i128,
        interest_bps: u32,
    ) {
        // Verify the caller is actually the admin
        admin.require_auth();

        let key = PoolKey { pool_id };

        // Prevent duplicate pools
        if env.storage().persistent().has(&key) {
            panic!("pool already exists");
        }

        let pool = Pool {
            admin,
            token,
            total_funds: 0,
            loan_count: 0,
            max_loan_amount,
            interest_bps,
        };

        // Store the pool with long-lived persistent storage
        env.storage().persistent().set(&key, &pool);

        // Emit an event so frontends can index new pools
        env.events().publish(
            (Symbol::new(&env, "pool_created"), pool_id),
            pool_id,
        );
    }

    // ── 2. Deposit savings into the pool ─────────────────────────────────
    /// Any student deposits USDC into the pool, growing the lending fund.
    /// Uses Stellar's token interface — the USDC transfer happens on-chain.
    pub fn deposit(
        env: Env,
        pool_id: u64,
        depositor: Address,
        amount: i128,
    ) {
        depositor.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let key = PoolKey { pool_id };
        let mut pool: Pool = env.storage().persistent().get(&key).expect("pool not found");

        // Transfer USDC from depositor's wallet → this contract
        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(&depositor, &env.current_contract_address(), &amount);

        // Record the new total
        pool.total_funds += amount;
        env.storage().persistent().set(&key, &pool);

        env.events().publish(
            (Symbol::new(&env, "deposited"), pool_id),
            (depositor, amount),
        );
    }

    // ── 3. Request a microloan ────────────────────────────────────────────
    /// A student requests a loan from the pool.
    /// The contract checks pool liquidity and the per-loan cap,
    /// then disburses USDC directly to the student's wallet.
    /// Returns the new loan_id.
    pub fn request_loan(
        env: Env,
        pool_id: u64,
        borrower: Address,
        amount: i128,
    ) -> u64 {
        borrower.require_auth();

        if amount <= 0 {
            panic!("loan amount must be positive");
        }

        let pool_key = PoolKey { pool_id };
        let mut pool: Pool = env.storage().persistent().get(&pool_key).expect("pool not found");

        // Enforce the per-loan cap set by the pool admin
        if amount > pool.max_loan_amount {
            panic!("exceeds max loan amount");
        }

        // Ensure the pool has enough liquidity
        if amount > pool.total_funds {
            panic!("insufficient pool funds");
        }

        // Calculate repayment = principal + (principal * bps / 10_000)
        let interest = (amount * pool.interest_bps as i128) / 10_000;
        let repayment_amount = amount + interest;

        let loan_id = pool.loan_count;
        let loan_key = LoanKey { pool_id, loan_id };

        let loan = Loan {
            borrower: borrower.clone(),
            principal: amount,
            repayment_amount,
            repaid: false,
            disbursed_at: env.ledger().sequence(),
        };

        // Deduct from pool and record the loan
        pool.total_funds -= amount;
        pool.loan_count += 1;
        env.storage().persistent().set(&pool_key, &pool);
        env.storage().persistent().set(&loan_key, &loan);

        // Disburse USDC to the student — the key Stellar primitive
        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(&env.current_contract_address(), &borrower, &amount);

        env.events().publish(
            (Symbol::new(&env, "loan_disbursed"), pool_id),
            (borrower, amount, loan_id),
        );

        loan_id
    }

    // ── 4. Repay a loan ───────────────────────────────────────────────────
    /// The borrower repays their loan (principal + interest) in one transfer.
    /// Funds re-enter the pool, making them available for the next student.
    pub fn repay_loan(
        env: Env,
        pool_id: u64,
        loan_id: u64,
        borrower: Address,
    ) {
        borrower.require_auth();

        let pool_key = PoolKey { pool_id };
        let loan_key = LoanKey { pool_id, loan_id };

        let mut pool: Pool = env.storage().persistent().get(&pool_key).expect("pool not found");
        let mut loan: Loan = env.storage().persistent().get(&loan_key).expect("loan not found");

        // Guard: only the original borrower can repay
        if loan.borrower != borrower {
            panic!("not the borrower");
        }

        if loan.repaid {
            panic!("loan already repaid");
        }

        // Transfer repayment_amount from borrower → contract (pool)
        let token_client = token::Client::new(&env, &pool.token);
        token_client.transfer(
            &borrower,
            &env.current_contract_address(),
            &loan.repayment_amount,
        );

        // Mark loan repaid and grow the pool (principal + interest returned)
        loan.repaid = true;
        pool.total_funds += loan.repayment_amount;

        env.storage().persistent().set(&loan_key, &loan);
        env.storage().persistent().set(&pool_key, &pool);

        env.events().publish(
            (Symbol::new(&env, "loan_repaid"), pool_id),
            (borrower, loan_id),
        );
    }

    // ── 5. Read helpers ───────────────────────────────────────────────────

    /// Returns pool state — useful for dashboards showing available liquidity
    pub fn get_pool(env: Env, pool_id: u64) -> Pool {
        env.storage()
            .persistent()
            .get(&PoolKey { pool_id })
            .expect("pool not found")
    }

    /// Returns loan state — borrower and frontend can check repayment status
    pub fn get_loan(env: Env, pool_id: u64, loan_id: u64) -> Loan {
        env.storage()
            .persistent()
            .get(&LoanKey { pool_id, loan_id })
            .expect("loan not found")
    }
}
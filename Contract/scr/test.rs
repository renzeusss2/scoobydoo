#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token, Address, Env,
    };

    // ─── Shared test setup ───────────────────────────────────────────────

    fn setup() -> (Env, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        // Deploy a mock USDC token (SAC-compatible) to simulate real USDC on testnet
        let token_admin = Address::generate(&env);
        let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_contract_id.address();

        // Mint USDC to an admin (pool creator) and a student borrower
        let admin = Address::generate(&env);
        let student = Address::generate(&env);

        let token_admin_client =
            token::StellarAssetClient::new(&env, &token_address);
        token_admin_client.mint(&admin, &10_000_000);  // 10 USDC (7 decimals)
        token_admin_client.mint(&student, &5_000_000); // 5 USDC

        let contract_id = env.register(StudyLendContract, ());

        (env, contract_id, token_address, admin, student)
    }

    // ─── Test 1: Happy path — full MVP flow ─────────────────────────────
    // Creates a pool → deposits savings → student requests loan → USDC arrives
    #[test]
    fn test_full_loan_flow() {
        let (env, contract_id, token_address, admin, student) = setup();
        let client = StudyLendContractClient::new(&env, &contract_id);

        // Step 1: Admin creates a pool (max 2 USDC loans, 2% interest)
        client.create_pool(&1u64, &admin, &token_address, &2_000_000i128, &200u32);

        // Step 2: Admin deposits 5 USDC into the pool
        client.deposit(&1u64, &admin, &5_000_000i128);

        // Step 3: Student borrows 1 USDC
        let loan_id = client.request_loan(&1u64, &student, &1_000_000i128);
        assert_eq!(loan_id, 0u64);

        // Verify the student actually received the USDC
        let token_client = token::Client::new(&env, &token_address);
        let student_balance = token_client.balance(&student);
        // Student started with 5, borrowed 1 more → 6 USDC
        assert_eq!(student_balance, 6_000_000i128);

        // Pool liquidity reduced by the loan principal
        let pool = client.get_pool(&1u64);
        assert_eq!(pool.total_funds, 4_000_000i128);
    }

    // ─── Test 2: Edge case — loan exceeds pool max cap ───────────────────
    // Admin sets a 2 USDC cap; student tries to borrow 3 USDC → must panic
    #[test]
    #[should_panic(expected = "exceeds max loan amount")]
    fn test_loan_exceeds_cap() {
        let (env, contract_id, token_address, admin, student) = setup();
        let client = StudyLendContractClient::new(&env, &contract_id);

        client.create_pool(&2u64, &admin, &token_address, &2_000_000i128, &200u32);
        client.deposit(&2u64, &admin, &5_000_000i128);

        // Request 3 USDC — above the 2 USDC cap — should panic
        client.request_loan(&2u64, &student, &3_000_000i128);
    }

    // ─── Test 3: State verification — repayment restores pool funds ──────
    // After repay, pool.total_funds = original + interest; loan.repaid = true
    #[test]
    fn test_repayment_state() {
        let (env, contract_id, token_address, admin, student) = setup();
        let client = StudyLendContractClient::new(&env, &contract_id);

        client.create_pool(&3u64, &admin, &token_address, &2_000_000i128, &200u32);
        client.deposit(&3u64, &admin, &5_000_000i128);

        let loan_id = client.request_loan(&3u64, &student, &1_000_000i128);
        // Pool should now have 4_000_000 after disbursement
        let pool_after_loan = client.get_pool(&3u64);
        assert_eq!(pool_after_loan.total_funds, 4_000_000i128);

        // Repay: 1_000_000 principal + 20_000 interest (2%) = 1_020_000
        client.repay_loan(&3u64, &loan_id, &student);

        let pool_after_repay = client.get_pool(&3u64);
        // Pool regains principal + interest: 4_000_000 + 1_020_000 = 5_020_000
        assert_eq!(pool_after_repay.total_funds, 5_020_000i128);

        let loan = client.get_loan(&3u64, &loan_id);
        assert!(loan.repaid);
    }

    // ─── Test 4: Edge case — double repayment rejected ───────────────────
    // Calling repay_loan twice on the same loan must panic
    #[test]
    #[should_panic(expected = "loan already repaid")]
    fn test_double_repayment_rejected() {
        let (env, contract_id, token_address, admin, student) = setup();
        let client = StudyLendContractClient::new(&env, &contract_id);

        client.create_pool(&4u64, &admin, &token_address, &2_000_000i128, &200u32);
        client.deposit(&4u64, &admin, &5_000_000i128);
        let loan_id = client.request_loan(&4u64, &student, &1_000_000i128);

        client.repay_loan(&4u64, &loan_id, &student);
        // Second call should panic
        client.repay_loan(&4u64, &loan_id, &student);
    }

    // ─── Test 5: Edge case — pool with zero liquidity rejects loan ───────
    // If no one has deposited, requesting any loan must panic
    #[test]
    #[should_panic(expected = "insufficient pool funds")]
    fn test_empty_pool_rejects_loan() {
        let (env, contract_id, token_address, admin, student) = setup();
        let client = StudyLendContractClient::new(&env, &contract_id);

        // Create pool but deposit nothing
        client.create_pool(&5u64, &admin, &token_address, &2_000_000i128, &200u32);

        // Student tries to borrow from an empty pool — should panic
        client.request_loan(&5u64, &student, &500_000i128);
    }
}
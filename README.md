StudyLend

On-chain student savings pools and microloans — SEA

Problem
A Nursing student in Cebu needs ₱2,000 for board exam review materials two weeks before the test. Her monthly stipend hasn't arrived, and informal 5-6 lenders charge 20% weekly interest — so she borrows from a classmate with no receipt, no repayment plan, and a damaged friendship as the consequence.

Solution
Student orgs create a shared USDC savings pool (an on-chain paluwagan) via Soroban smart contract. Members deposit savings; any member can request a microloan instantly. The contract enforces caps and interest, disburses USDC in one Stellar transaction, and repayments grow the pool for the next student — no bank, no 5-6, no IOU.

Mvp transaction flow

Treasurer creates pool (max cap + interest) › Members deposit USDC into contract › Student calls request_loan on-chain › USDC arrives in student wallet (<5s) › Student repays; pool grows with interest

Stellar features used
USDC (SAC) 
Soroban contracts 
Trustlines 
XLM (fees)

Target users
Who - Student org members, 18–25
Where - PH, ID, VN — metro + provincial
Pain - Cash-flow gaps before exams
Incentive - Zero collateral, 2% flat vs 5-6

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/86320492-bf57-4dc2-9ee6-2afbc67e2a6f" />

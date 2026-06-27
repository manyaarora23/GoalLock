# GoalLock Soroban Contract

GoalLock is a non-custodial, time-locked savings contract for Stellar. A user creates a goal, deposits tokens into it, and can withdraw the balance only after the chosen unlock timestamp. The contract—not the frontend—enforces the lock.

## Contract API

| Function | Description |
| --- | --- |
| `init(token)` | Sets the Stellar Asset Contract used by GoalLock. Can run only once. |
| `create_goal(owner, title, target_amount, unlock_timestamp)` | Creates an empty goal and returns its numeric ID. |
| `deposit(owner, goal_id, amount)` | Transfers a positive token amount from the owner into their goal. |
| `withdraw(owner, goal_id)` | Returns the full balance after the unlock time and marks the goal withdrawn. |
| `get_goal(goal_id)` | Reads a single goal. |
| `get_user_goals(owner)` | Lists goals belonging to an address. |
| `get_goals_count()` | Returns the latest goal ID. |

All state-changing owner operations require Soroban authorization. Deposits from other addresses, zero-value deposits, early withdrawals, repeat withdrawals, and withdrawals by another address are rejected.

## Events

The contract emits `goal_cr`, `deposit`, and `withdraw` events so clients and explorers can index the full savings lifecycle.

## Build and test

Install the Rust toolchain and Stellar CLI, then run from this directory:

```bash
cargo test
stellar contract build
```

The tests cover creation and lookup, owner authorization, multiple and invalid deposits, early-withdraw protection, successful withdrawal after unlock, and repeat-withdraw protection. Snapshots live under `contracts/contract/test_snapshots`.

## Deployment

1. Deploy a Stellar Asset Contract for the desired asset (native XLM for the testnet demo).
2. Build and deploy the GoalLock WASM.
3. Invoke `init` once with the asset contract address.
4. Set `NEXT_PUBLIC_GOALLOCK_CONTRACT_ID` in the frontend.
5. Optionally set `NEXT_PUBLIC_STELLAR_RPC_URL`; it defaults to the public testnet RPC.

Amounts use the asset's smallest unit (7 decimals for XLM), and timestamps use Unix seconds. This hackathon contract should receive a dedicated security review before mainnet deployment.

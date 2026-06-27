# 🔒 GoalLock

> **Save now. Unlock only when your goal date arrives.**

GoalLock is a decentralized goal-based savings application built on the **Stellar Blockchain** using **Soroban Smart Contracts**. It enables users to lock XLM for a specific financial goal and ensures that the funds cannot be withdrawn until the chosen unlock date.

Unlike traditional savings apps that rely on trust or reminders, GoalLock uses blockchain-enforced time locks, making savings automatic, transparent, and tamper-proof.

---

## 🌟 Why GoalLock?

People often struggle to save money because funds remain easily accessible. Whether it's for a certification exam, a new laptop, a hackathon registration, or emergency savings, unexpected spending can derail long-term goals.

GoalLock removes temptation by allowing users to commit their funds to a smart contract that releases them only when the goal date arrives.

The blockchain becomes your accountability partner.

---

## 💡 Real-World Use Cases

* 📚 Certification Fees
* 💻 Laptop or Device Fund
* ✈️ College Trip Savings
* 🚀 Hackathon Registration
* 📖 Online Course Purchase
* 🩺 Emergency Fund
* 🎓 Semester Fee Planning
* 🎁 Personal Savings Goals

---

# ✨ Key Features

### 🔐 Time-Locked Savings

Deposit XLM into a Soroban Smart Contract that securely locks your funds until your selected date.

---

### 👛 Freighter Wallet Integration

Connect your Stellar wallet securely and manage your savings goals without creating a separate account.

---

### ⏳ Live Countdown

Every goal displays a real-time countdown showing exactly when your funds become available.

---

### 🚫 Early Withdrawal Protection

Attempts to withdraw before the unlock date are automatically rejected by the smart contract.

---

### ✅ Automatic Unlock

Once the unlock timestamp is reached, the owner can instantly withdraw the locked funds.

---

### 📊 Personal Dashboard

Track all your goals in one place.

* Active Goals
* Locked Balance
* Goal Progress
* Unlock Status
* Transaction History

---

### 🌐 Powered by Stellar

Built using the Stellar ecosystem for:

* Fast Transactions
* Low Fees
* Secure Smart Contracts
* Global Accessibility

---

# 🏗 Architecture

```
Freighter Wallet
        │
        ▼
 Next.js + Tailwind Frontend
        │
 Stellar SDK
        │
        ▼
 Soroban Smart Contract
        │
 Stellar Testnet
```

---

# ⚙ Smart Contract

The Soroban contract manages all savings goals on-chain.

### Functions

```rust
create_goal()
deposit()
get_goal()
withdraw()
```

### Rules

✔ Only the owner can deposit.

✔ Only the owner can withdraw.

✔ Withdrawal before unlock time is rejected.

✔ Funds are released only after the unlock timestamp.

---

# 🚀 User Flow

```
Connect Wallet
      │
      ▼
Create Goal
      │
      ▼
Deposit XLM
      │
      ▼
Funds Locked 🔒
      │
      ├─────────────► Try Withdraw
      │                    │
      │                    ▼
      │             ❌ Transaction Rejected
      │
      ▼
Countdown Ends
      │
      ▼
Withdraw Funds
      │
      ▼
Goal Completed ✅
```

---

# 📱 Application Screens

* Landing Page
* Wallet Connection
* Dashboard
* Create Goal
* Goal Details
* Deposit Funds
* Countdown Timer
* Withdraw Screen
* Transaction History

---

# 🛠 Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* TypeScript

### Blockchain

* Stellar SDK
* Soroban Smart Contracts
* Stellar Testnet
* Freighter Wallet

### Backend

* API Routes
* Authentication
* Database for Goal Metadata

---

# 🎯 Demo Scenario

### Goal

AWS Cloud Practitioner Certification

### Amount

25 XLM

### Unlock Time

2 Minutes (Demo Mode)

### Expected Flow

1. Connect Freighter Wallet
2. Create a Goal
3. Deposit 25 XLM
4. Countdown Starts
5. Attempt Early Withdrawal
6. Smart Contract Rejects Transaction
7. Wait for Timer
8. Withdraw Successfully
9. View Transaction Hash
10. Goal Completed

---

# 🔒 Security

GoalLock ensures that:

* Funds never leave the owner's control.
* Savings rules are enforced entirely on-chain.
* No centralized authority can unlock funds early.
* Every transaction is transparent and verifiable.

---

# 📈 Future Roadmap

* 📅 Recurring Monthly Savings
* 🎯 Shared Family Goals
* 👥 Group Savings Pools
* 🔔 Goal Reminder Notifications
* 📊 Savings Analytics
* 🪙 Support for Multiple Stellar Assets
* 📱 Mobile Application
* 🤖 AI Savings Recommendations
* 🌍 Mainnet Deployment

---

# 🌍 Why Stellar?

GoalLock is built on Stellar because it offers:

* Extremely low transaction costs
* Fast settlement
* Secure decentralized infrastructure
* Native support for digital assets
* Modern Soroban smart contracts

This makes Stellar an ideal blockchain for personal finance and savings applications.

---

# ❤️ Team

Built with ❤️ using the Stellar Ecosystem.

---

## 📄 License

MIT License

---

> **GoalLock isn't just about saving money. It's about building the discipline to achieve your future—one locked goal at a time.**

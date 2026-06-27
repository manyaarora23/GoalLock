"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Fingerprint,
  Landmark,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  CONTRACT_ID,
  IS_CONFIGURED,
  NETWORK,
  mockHash,
  submitGoalCall,
  type GoalContractCall,
} from "@/lib/stellar";

type GoalStatus = "locked" | "ready" | "completed";
type Goal = {
  id: number;
  title: string;
  category: string;
  icon: string;
  target: number;
  saved: number;
  unlockAt: number;
  status: GoalStatus;
  color: string;
};
type Activity = {
  id: number;
  type: "deposit" | "created" | "withdrawn";
  title: string;
  amount?: number;
  time: string;
  hash: string;
};

const DAY = 86_400_000;
const INITIAL_NOW = Date.now();
const initialGoals: Goal[] = [
  {
    id: 1,
    title: "AWS Certification",
    category: "Education",
    icon: "✦",
    target: 80,
    saved: 62.5,
    unlockAt: INITIAL_NOW + DAY * 18 + 3_720_000,
    status: "locked",
    color: "lime",
  },
  {
    id: 2,
    title: "New laptop",
    category: "Technology",
    icon: "⌘",
    target: 250,
    saved: 118,
    unlockAt: INITIAL_NOW + DAY * 42,
    status: "locked",
    color: "violet",
  },
  {
    id: 3,
    title: "Hackathon trip",
    category: "Travel",
    icon: "↗",
    target: 40,
    saved: 40,
    unlockAt: INITIAL_NOW - 60_000,
    status: "ready",
    color: "amber",
  },
];

const initialActivity: Activity[] = [
  { id: 1, type: "deposit", title: "AWS Certification", amount: 12.5, time: "Today, 10:42", hash: "0d7c8a…2f91" },
  { id: 2, type: "created", title: "New laptop", time: "Jun 24, 18:16", hash: "89a411…c30e" },
  { id: 3, type: "deposit", title: "Hackathon trip", amount: 20, time: "Jun 21, 09:03", hash: "bb182e…04af" },
];

function short(value: string, head = 6, tail = 4) {
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function countdown(unlockAt: number, now: number) {
  const distance = Math.max(0, unlockAt - now);
  const days = Math.floor(distance / DAY);
  const hours = Math.floor((distance % DAY) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  const seconds = Math.floor((distance % 60_000) / 1_000);
  return { distance, days, hours, minutes, seconds };
}

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="count-box">
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [demoMode, setDemoMode] = useState(!IS_CONFIGURED);
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [goals, setGoals] = useState(initialGoals);
  const [selectedId, setSelectedId] = useState(1);
  const [activity, setActivity] = useState(initialActivity);
  const [now, setNow] = useState(INITIAL_NOW);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const [deposit, setDeposit] = useState("10");
  const [lastHash, setLastHash] = useState("5bd29f9ed7a112ea8db117174cc2eb146a9fac1de8012a73ef3ec5f1c7d63a80");
  const [form, setForm] = useState({ title: "", category: "Education", target: "", date: "" });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selected = goals.find((goal) => goal.id === selectedId) ?? goals[0];
  const totalLocked = goals.reduce((sum, goal) => sum + (goal.status === "completed" ? 0 : goal.saved), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const progress = totalTarget ? Math.round((goals.reduce((sum, goal) => sum + goal.saved, 0) / totalTarget) * 100) : 0;
  const selectedCountdown = countdown(selected.unlockAt, now);
  const effectiveStatus: GoalStatus = selected.status === "locked" && selectedCountdown.distance === 0 ? "ready" : selected.status;
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${lastHash}`;

  const invoke = async (call: GoalContractCall) => {
    if (!address || demoMode) return mockHash();
    try {
      return await submitGoalCall(call, address);
    } catch {
      setDemoMode(true);
      setToast("Contract unavailable — continued safely in demo mode");
      return mockHash();
    }
  };

  const connectFreighter = async () => {
    setBusy("wallet");
    try {
      const { requestAccess } = await import("@stellar/freighter-api");
      const response = await requestAccess();
      if (response.error || !response.address) throw new Error("Wallet access unavailable");
      setAddress(response.address);
      setDemoMode(!IS_CONFIGURED);
      setConnected(true);
      setWalletOpen(false);
      setToast("Freighter connected to Stellar Testnet");
    } catch {
      setToast("Freighter not detected — try the demo wallet");
    } finally {
      setBusy("");
    }
  };

  const connectDemo = () => {
    setAddress("GD7KQWVZV6M4Y7ACN2RXR6D5TUJSMXQZPZ5KUKXYDXQG4R3JGOALLOCK");
    setConnected(true);
    setDemoMode(true);
    setWalletOpen(false);
    setToast("Demo wallet connected — no real funds are used");
  };

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.target || !form.date) return;
    const unlockAt = new Date(form.date).getTime();
    if (unlockAt <= Date.now()) {
      setToast("Choose a future unlock date");
      return;
    }
    setBusy("create");
    const hash = await invoke({ method: "create_goal", title: form.title, target: form.target, unlockAt: Math.floor(unlockAt / 1000) });
    const newGoal: Goal = {
      id: Math.max(...goals.map((goal) => goal.id)) + 1,
      title: form.title,
      category: form.category,
      icon: "◎",
      target: Number(form.target),
      saved: 0,
      unlockAt,
      status: "locked",
      color: "blue",
    };
    setGoals((current) => [newGoal, ...current]);
    setActivity((current) => [{ id: Date.now(), type: "created", title: form.title, time: "Just now", hash: short(hash) }, ...current]);
    setSelectedId(newGoal.id);
    setLastHash(hash);
    setCreateOpen(false);
    setForm({ title: "", category: "Education", target: "", date: "" });
    setBusy("");
    setToast("Goal created and time-lock scheduled");
  };

  const depositFunds = async () => {
    const amount = Number(deposit);
    if (!amount || amount <= 0 || selected.status === "completed") return;
    setBusy("deposit");
    const hash = await invoke({ method: "deposit", goalId: selected.id, amount: deposit });
    setGoals((current) => current.map((goal) => goal.id === selected.id ? { ...goal, saved: goal.saved + amount } : goal));
    setActivity((current) => [{ id: Date.now(), type: "deposit", title: selected.title, amount, time: "Just now", hash: short(hash) }, ...current]);
    setLastHash(hash);
    setBusy("");
    setToast(`${amount.toFixed(2)} XLM deposited and locked`);
  };

  const withdrawFunds = async () => {
    if (effectiveStatus !== "ready") return;
    setBusy("withdraw");
    const hash = await invoke({ method: "withdraw", goalId: selected.id });
    const amount = selected.saved;
    setGoals((current) => current.map((goal) => goal.id === selected.id ? { ...goal, status: "completed", saved: 0 } : goal));
    setActivity((current) => [{ id: Date.now(), type: "withdrawn", title: selected.title, amount, time: "Just now", hash: short(hash) }, ...current]);
    setLastHash(hash);
    setBusy("");
    setToast(`Success — ${amount.toFixed(2)} XLM returned to your wallet`);
  };

  const copy = async (value: string) => {
    await navigator.clipboard?.writeText(value);
    setToast("Copied to clipboard");
  };

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="GoalLock home"><span><LockKeyhole size={17} strokeWidth={2.6} /></span>GoalLock</a>
        <div className="nav-links">
          <a href="#dashboard">Dashboard</a><a href="#goals">Goals</a><a href="#activity">Activity</a>
        </div>
        <div className="nav-actions">
          <span className="network"><i /> Stellar Testnet</span>
          {connected ? (
            <button className="wallet-pill" onClick={() => setWalletOpen(true)}><span className="wallet-avatar">G</span>{short(address)}<ChevronDown size={14} /></button>
          ) : (
            <button className="button dark compact" onClick={() => setWalletOpen(true)}><WalletCards size={17} /> Connect wallet</button>
          )}
          <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileOpen && <div className="mobile-nav"><a href="#dashboard">Dashboard</a><a href="#goals">Goals</a><a href="#activity">Activity</a></div>}
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> Savings with a backbone</div>
          <h1>Your goals deserve<br /><em>more than good intentions.</em></h1>
          <p>Lock your XLM until a date you choose. No impulse withdrawals, no excuses — just smart contracts keeping your future on track.</p>
          <div className="hero-actions">
            <button className="button lime" onClick={() => connected ? setCreateOpen(true) : setWalletOpen(true)}>{connected ? "Create a goal" : "Start saving"}<ArrowRight size={18} /></button>
            <a className="text-link" href="#how-it-works">See how it works <ArrowDownLeft size={17} /></a>
          </div>
          <div className="hero-trust"><div className="faces"><span>G</span><span>◎</span><span>✦</span></div><p><b>Built on Stellar</b><small>Fast, secure & transparent</small></p></div>
        </div>
        <div className="hero-visual" aria-label="GoalLock savings preview">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="preview-card">
            <div className="preview-head"><div><span className="mini-label">SAVING FOR</span><h3>AWS Certification</h3></div><span className="lock-chip"><LockKeyhole size={14} /> Locked</span></div>
            <div className="preview-amount"><strong>62.50</strong><span>XLM</span></div>
            <div className="progress"><i style={{ width: "78%" }} /></div>
            <div className="preview-meta"><span>78% funded</span><span>80 XLM goal</span></div>
            <div className="unlock-card"><Clock3 size={18} /><div><span>UNLOCKS IN</span><strong>18 days · 1 hour</strong></div><Fingerprint size={24} /></div>
          </div>
          <div className="float-card shield"><ShieldCheck size={19} /><span><b>100% on-chain</b><small>Secured by Soroban</small></span></div>
          <div className="float-card success"><BadgeCheck size={19} /><span><b>Goal funded!</b><small>+12.50 XLM locked</small></span></div>
        </div>
      </section>

      <section id="how-it-works" className="trust-strip">
        <div className="shell trust-grid"><span><ShieldCheck />Non-custodial</span><span><Zap />3–5 second settlement</span><span><Fingerprint />Contract-enforced locks</span><span><CircleDollarSign />Near-zero network fees</span></div>
      </section>

      <section id="dashboard" className="dashboard-section">
        <div className="shell">
          <div className="section-head">
            <div><span className="section-kicker">YOUR SPACE</span><h2>{connected ? "Welcome back, goal getter." : "A dashboard built for momentum."}</h2><p>{connected ? "Small deposits. Serious progress. Here’s where you stand." : "Connect a wallet or use demo mode to explore the complete savings flow."}</p></div>
            <button className="button dark" onClick={() => connected ? setCreateOpen(true) : setWalletOpen(true)}><Plus size={18} /> New goal</button>
          </div>

          {demoMode && connected && <div className="demo-banner"><span><Sparkles size={16} /> <b>Demo mode</b> — interactions are simulated; no real XLM moves.</span><span>Ready for testnet when a contract ID is configured.</span></div>}

          <div className="stats-grid">
            <article className="stat-card featured"><div className="stat-icon"><Landmark /></div><span>Total locked</span><strong>{totalLocked.toFixed(2)} <small>XLM</small></strong><p><TrendingUp size={14} /> +12.5 XLM this week</p></article>
            <article className="stat-card"><div className="stat-icon purple"><Target /></div><span>Active goals</span><strong>{goals.filter((g) => g.status !== "completed").length}</strong><p>{goals.filter((g) => g.status === "ready").length} ready to unlock</p></article>
            <article className="stat-card"><div className="stat-icon yellow"><TrendingUp /></div><span>Overall progress</span><strong>{progress}%</strong><div className="stat-progress"><i style={{ width: `${progress}%` }} /></div><p>{(totalTarget - goals.reduce((s, g) => s + g.saved, 0)).toFixed(1)} XLM to all targets</p></article>
            <article className="stat-card"><div className="stat-icon blue"><CalendarDays /></div><span>Next unlock</span><strong>{countdown(Math.min(...goals.filter(g => g.status === "locked").map(g => g.unlockAt)), now).days} <small>days</small></strong><p>AWS Certification</p></article>
          </div>

          <div className="workspace-grid">
            <div id="goals" className="panel goals-panel">
              <div className="panel-head"><div><h3>Your goals</h3><p>Choose one to see its lock details.</p></div><span className="count-chip">{goals.length} total</span></div>
              <div className="goal-list">
                {goals.map((goal) => {
                  const goalCountdown = countdown(goal.unlockAt, now);
                  const status = goal.status === "locked" && goalCountdown.distance === 0 ? "ready" : goal.status;
                  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
                  return <button key={goal.id} className={`goal-row ${selected.id === goal.id ? "selected" : ""}`} onClick={() => setSelectedId(goal.id)}>
                    <span className={`goal-icon ${goal.color}`}>{goal.icon}</span>
                    <span className="goal-main"><span className="goal-title"><b>{goal.title}</b><small>{goal.category}</small></span><span className="row-progress"><i style={{ width: `${pct}%` }} /></span><span className="goal-bottom"><small>{goal.saved.toFixed(1)} / {goal.target} XLM</small><small>{pct}%</small></span></span>
                    <span className={`status ${status}`}>{status === "locked" ? <LockKeyhole size={12} /> : <Check size={12} />}{status === "ready" ? "Ready" : status === "completed" ? "Done" : `${goalCountdown.days}d left`}</span>
                  </button>;
                })}
              </div>
              <button className="add-row" onClick={() => connected ? setCreateOpen(true) : setWalletOpen(true)}><Plus size={17} /> Create another goal</button>
            </div>

            <div className="panel detail-panel">
              <div className="detail-top"><span className={`goal-icon large ${selected.color}`}>{selected.icon}</span><div><span className="mini-label">GOAL #{String(selected.id).padStart(3, "0")}</span><h3>{selected.title}</h3></div><span className={`status ${effectiveStatus}`}>{effectiveStatus === "locked" ? <LockKeyhole size={12} /> : <Check size={12} />}{effectiveStatus === "locked" ? "Funds locked" : effectiveStatus === "ready" ? "Ready to withdraw" : "Completed"}</span></div>

              {effectiveStatus === "completed" ? (
                <div className="success-state"><span><Check size={28} /></span><h3>Withdrawal successful</h3><p>Your locked XLM has been returned to your Freighter wallet.</p><a href={explorerUrl} target="_blank" rel="noreferrer">View transaction <ExternalLink size={14} /></a></div>
              ) : effectiveStatus === "locked" ? (
                <div className="countdown-wrap"><span>FUNDS UNLOCK IN</span><div className="countdown"><CountBox value={selectedCountdown.days} label="DAYS" /><b>:</b><CountBox value={selectedCountdown.hours} label="HRS" /><b>:</b><CountBox value={selectedCountdown.minutes} label="MIN" /><b>:</b><CountBox value={selectedCountdown.seconds} label="SEC" /></div><p><LockKeyhole size={14} /> Early withdrawal is blocked by the smart contract</p></div>
              ) : (
                <div className="ready-state"><span><BadgeCheck size={25} /></span><div><b>Your goal is unlocked</b><p>The lock period is complete. Funds are ready for your wallet.</p></div></div>
              )}

              <div className="detail-numbers"><div><span>Saved</span><b>{selected.saved.toFixed(2)} XLM</b></div><div><span>Target</span><b>{selected.target.toFixed(2)} XLM</b></div><div><span>Unlock date</span><b>{new Date(selected.unlockAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</b></div></div>

              {effectiveStatus !== "completed" && <div className="action-zone">
                <div className="deposit-control"><span><input aria-label="Deposit amount" type="number" min="0.1" step="0.1" value={deposit} onChange={(e) => setDeposit(e.target.value)} /><small>XLM</small></span><button disabled={!connected || busy === "deposit"} onClick={depositFunds}>{busy === "deposit" ? "Confirming…" : "Deposit"}</button></div>
                <button className={`withdraw-button ${effectiveStatus === "ready" ? "available" : ""}`} disabled={!connected || effectiveStatus !== "ready" || busy === "withdraw"} onClick={withdrawFunds}>{effectiveStatus === "ready" ? <ArrowUpRight size={17} /> : <LockKeyhole size={15} />}{busy === "withdraw" ? "Withdrawing…" : effectiveStatus === "ready" ? `Withdraw ${selected.saved.toFixed(2)} XLM` : "Withdrawal locked until unlock date"}</button>
              </div>}
            </div>
          </div>

          <div id="activity" className="panel activity-panel">
            <div className="panel-head"><div><h3>Recent activity</h3><p>Every move, verifiable on Stellar.</p></div><button className="plain-button">View all <ArrowRight size={15} /></button></div>
            <div className="activity-table">
              {activity.slice(0, 4).map((item) => <div className="activity-row" key={item.id}><span className={`activity-icon ${item.type}`}>{item.type === "deposit" ? <ArrowDownLeft /> : item.type === "withdrawn" ? <ArrowUpRight /> : <Plus />}</span><span className="activity-name"><b>{item.type === "deposit" ? "Deposit" : item.type === "withdrawn" ? "Withdrawal" : "Goal created"}</b><small>{item.title}</small></span><span className="activity-time">{item.time}</span><span className="activity-hash">{item.hash}<ExternalLink size={13} /></span><strong className={item.type === "withdrawn" ? "out" : ""}>{item.amount ? `${item.type === "withdrawn" ? "−" : "+"}${item.amount.toFixed(2)} XLM` : "—"}</strong></div>)}
            </div>
          </div>

          <div className="contract-bar"><span><Fingerprint size={17} /><span><small>GOALLOCK CONTRACT</small><b>{short(CONTRACT_ID, 10, 8)}</b></span></span><span className="contract-actions"><span className="network"><i /> {NETWORK}</span><button onClick={() => copy(CONTRACT_ID)}><Copy size={14} /> Copy ID</button><a href={explorerUrl} target="_blank" rel="noreferrer">Latest tx <ExternalLink size={14} /></a></span></div>
        </div>
      </section>

      <footer><div className="shell footer-inner"><a className="brand" href="#top"><span><LockKeyhole size={16} /></span>GoalLock</a><p>Turn intention into commitment, one block at a time.</p><span>Built on <b>Stellar</b> · Testnet 2026</span></div></footer>

      {walletOpen && <div className="modal-backdrop" onMouseDown={() => setWalletOpen(false)}><div className="modal wallet-modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setWalletOpen(false)}><X size={18} /></button>{connected ? <><span className="modal-icon"><WalletCards /></span><h2>Wallet connected</h2><p className="modal-sub">Connected to Stellar Testnet</p><div className="address-box"><span className="wallet-avatar">G</span><div><small>FREIGHTER ADDRESS</small><b>{short(address, 12, 10)}</b></div><button onClick={() => copy(address)}><Copy size={16} /></button></div><div className="wallet-mode"><span><i /> Network</span><b>Testnet</b></div><div className="wallet-mode"><span><ShieldCheck size={16} /> Mode</span><b>{demoMode ? "Demo fallback" : "Live contract"}</b></div><button className="disconnect" onClick={() => { setConnected(false); setAddress(""); setWalletOpen(false); }}><LogOut size={16} /> Disconnect wallet</button></> : <><span className="modal-icon"><WalletCards /></span><h2>Connect your wallet</h2><p className="modal-sub">Use Freighter on Stellar Testnet, or explore safely with the demo wallet.</p><button className="wallet-option" onClick={connectFreighter} disabled={busy === "wallet"}><span className="freighter-mark">F</span><span><b>{busy === "wallet" ? "Opening Freighter…" : "Freighter"}</b><small>Recommended · Stellar wallet</small></span><ArrowRight size={18} /></button><button className="wallet-option demo" onClick={connectDemo}><span className="demo-mark"><Sparkles size={18} /></span><span><b>Demo wallet</b><small>No extension or real funds needed</small></span><ArrowRight size={18} /></button><p className="wallet-note"><ShieldCheck size={14} /> GoalLock never stores your keys or seed phrase.</p></>}</div></div>}

      {createOpen && <div className="modal-backdrop" onMouseDown={() => setCreateOpen(false)}><form className="modal create-modal" onSubmit={createGoal} onMouseDown={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setCreateOpen(false)}><X size={18} /></button><span className="modal-icon"><Target /></span><h2>Create a savings goal</h2><p className="modal-sub">Give your future money a job — and a date.</p><label>Goal name<input placeholder="e.g. Design conference" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><div className="form-grid"><label>Target amount<span className="input-suffix"><input type="number" min="1" step="0.1" placeholder="100" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} required /><small>XLM</small></span></label><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Education</option><option>Travel</option><option>Technology</option><option>Emergency</option><option>Other</option></select></label></div><label>Unlock date<input type="datetime-local" min={new Date(now + 60_000).toISOString().slice(0, 16)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label><div className="lock-warning"><LockKeyhole size={18} /><p><b>This date is final.</b><span>The smart contract will block all withdrawals until this exact time.</span></p></div><button className="button lime submit" disabled={busy === "create"}>{busy === "create" ? "Signing transaction…" : "Create locked goal"}<ArrowRight size={18} /></button></form></div>}

      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </main>
  );
}

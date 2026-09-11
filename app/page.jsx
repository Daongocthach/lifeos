'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vqvlpfcxnywacebpxtdz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_9Gu4TCc7eeFVsdlkzQc_DQ_M-GGq281'
const db = createClient(supabaseUrl, supabaseKey)

const navItems = [
  ['⌂', 'Overview'],
  ['▣', 'Finance'],
  ['♢', 'Gym'],
  ['♜', 'Nutrition'],
  ['◉', 'Funds'],
  ['□', 'Calendar'],
  ['⌁', 'Analytics'],
  ['⚙', 'Settings'],
]

const money = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫'
const todayLocal = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

export default function Page() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState('Overview')
  const [msg, setMsg] = useState('')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [income, setIncome] = useState(false)
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [weight, setWeight] = useState('')
  const [exercise, setExercise] = useState('')
  const [exercises, setExercises] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    db.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const x = db.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    return () => x.data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    db.from('exercises').select('id,name').order('name').then(({ data }) => setExercises(data || []))
    loadTransactions()
  }, [user])

  async function loadTransactions() {
    if (!user) return
    const { data } = await db.from('finance_transactions').select('id,amount,description,occurred_on').order('occurred_on', { ascending: false }).limit(8)
    setTransactions(data || [])
  }

  async function login() {
    const r = await db.auth.signInWithPassword({ email, password })
    setMsg(r.error?.message || '')
  }

  async function signup() {
    const r = await db.auth.signUp({ email, password })
    setMsg(r.error?.message || 'Check your email.')
  }

  async function addTx() {
    if (!amount || !desc) return setMsg('Nhập số tiền và nội dung.')
    const r = await db.from('finance_transactions').insert({
      user_id: user.id,
      occurred_on: date,
      description: desc,
      category_id: income ? 'a8c62218-aeee-46fc-91ae-5602719303d5' : '8199b7a5-6605-42d3-839d-2a84ecd90a91',
      amount: (income ? 1 : -1) * Number(amount),
    })
    setMsg(r.error?.message || 'Đã lưu giao dịch')
    if (!r.error) { setAmount(''); setDesc(''); loadTransactions() }
  }

  async function addWorkout() {
    if (!exercise || !sets || !reps) return setMsg('Chọn bài tập và nhập sets/reps.')
    const s = await db.from('workout_sessions').insert({ user_id: user.id, workout_date: date, name: 'Workout' }).select('id').single()
    if (s.error) { setMsg(s.error.message); return }
    const rows = Array.from({ length: Number(sets) }, (_, i) => ({ session_id: s.data.id, exercise_id: exercise, set_number: i + 1, weight_kg: weight ? Number(weight) : null, reps: Number(reps) }))
    const r = await db.from('workout_sets').insert(rows)
    setMsg(r.error?.message || 'Đã lưu buổi tập')
  }

  const monthStats = useMemo(() => {
    const incomeTotal = transactions.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0)
    const expenseTotal = transactions.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    return { incomeTotal, expenseTotal }
  }, [transactions])

  if (!user) return (
    <main className="auth-page">
      <div className="auth-visual">
        <div className="visual-top"><span className="leaf">◒</span><span className="visual-brand">Life<span>OS</span></span><span className="lang">VI⌄</span></div>
        <div className="visual-copy">
          <h1>Một cuộc sống tốt hơn,<br />bắt đầu từ những<br /><span>thói quen nhỏ mỗi ngày.</span></h1>
          <div className="benefits">
            <div><b>⌁</b><span>Quản lý tài chính<br />thông minh</span></div>
            <div><b>♢</b><span>Theo dõi tập luyện<br />và sức khoẻ</span></div>
            <div><b>♜</b><span>Ghi lại dinh dưỡng<br />hàng ngày</span></div>
          </div>
        </div>
        <div className="desk-copy"><strong>Good<br />Habits<br />Better<br />You</strong><small>“Sống có mục tiêu,<br />không chỉ tồn tại.”</small></div>
      </div>
      <div className="auth-side">
        <div className="login-card">
          <div className="mini-logo">◒</div>
          <h2>Đăng nhập</h2>
          <p>Chào mừng bạn trở lại với LifeOS</p>
          <label>Email<input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>Mật khẩu<input placeholder="Mật khẩu" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <div className="login-row"><label className="remember"><input type="checkbox" /> Ghi nhớ đăng nhập</label><button className="link-btn">Quên mật khẩu?</button></div>
          {msg && <small className="error">{msg}</small>}
          <button className="primary" onClick={login}>Đăng nhập <span>→</span></button>
          <div className="divider"><span>Hoặc tiếp tục với</span></div>
          <button className="google" onClick={login}><strong>G</strong> Đăng nhập bằng Google</button>
          <div className="signup">Chưa có tài khoản? <button className="link-btn" onClick={signup}>Đăng ký ngay</button></div>
        </div>
        <footer>Better Habits<br /><strong>A Brighter You</strong></footer>
      </div>
    </main>
  )

  const dashboardIncome = monthStats.incomeTotal || 14934000
  const dashboardExpense = monthStats.expenseTotal || 4041000

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>◒</span> Life<span>OS</span></div>
        <nav>{navItems.map(([icon, label]) => <button key={label} className={tab === label ? 'nav-item active' : 'nav-item'} onClick={() => setTab(label)}><i>{icon}</i>{label}</button>)}</nav>
        <div className="profile"><div className="avatar">{(user.email || 'U')[0].toUpperCase()}</div><div><b>LifeOS User</b><small>{user.email}</small></div></div>
        <button className="logout" onClick={() => db.auth.signOut()}>↪ Đăng xuất</button>
      </aside>

      <section className="dashboard">
        <header className="topbar"><div className="mobile-brand">◒ Life<span>OS</span></div><div className="top-actions"><button>⌕</button><button>♧</button><button className="today">Hôm nay⌄</button></div></header>
        {tab === 'Overview' && <>
          <section className="hero"><div><span className="eyebrow">THỨ NĂM, 10 THÁNG 9, 2026</span><h1>Xin chào! 👋</h1><p>“Những thay đổi nhỏ hôm nay tạo nên kết quả lớn ngày mai.”</p></div><div className="hero-orb">◐</div></section>
          <div className="stat-grid">
            <Stat icon="↗" label="Tổng thu nhập" value={money(dashboardIncome)} note="+100% so với tháng trước" tone="green" />
            <Stat icon="↘" label="Tổng chi tiêu" value={money(dashboardExpense)} note="-23% so với tháng trước" tone="red" />
            <Stat icon="✦" label="Tiết kiệm" value="8,000,000 ₫" note="53% mục tiêu" tone="mint" />
            <Stat icon="▣" label="Số dư khả dụng" value="2,893,000 ₫" note="Dành cho chi tiêu" tone="blue" />
          </div>
          <div className="analytics-grid"><FinanceChart /><SpendChart /></div>
          <div className="lower-grid"><GymCard /><NutritionCard /><FundCard /></div>
          <div className="bottom-grid"><ActivityCard transactions={transactions} /><GoalsCard /></div>
        </>}

        {tab === 'Finance' && <section className="content-panel"><div className="section-heading"><div><span className="eyebrow">FINANCE</span><h2>Ghi nhận giao dịch</h2></div><button className="pill">Tháng 9 ⌄</button></div><div className="entry-card"><div className="toggle"><button className={!income ? 'selected' : ''} onClick={() => setIncome(false)}>Chi tiêu</button><button className={income ? 'selected' : ''} onClick={() => setIncome(true)}>Thu nhập</button></div><div className="form-grid"><input type="number" placeholder="Số tiền (VND)" value={amount} onChange={e => setAmount(e.target.value)} /><input placeholder="Nội dung" value={desc} onChange={e => setDesc(e.target.value)} /><input type="date" value={date} onChange={e => setDate(e.target.value)} /><button className="primary" onClick={addTx}>Lưu giao dịch</button></div>{msg && <p className="message">{msg}</p>}</div></section>}
        {tab === 'Gym' && <section className="content-panel"><div className="section-heading"><div><span className="eyebrow">FITNESS</span><h2>Ghi nhận buổi tập</h2></div></div><div className="entry-card"><div className="form-grid"><select value={exercise} onChange={e => setExercise(e.target.value)}><option value="">Chọn bài tập</option>{exercises.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input type="number" placeholder="Tạ (kg)" value={weight} onChange={e => setWeight(e.target.value)} /><input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} /><input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} /><input type="date" value={date} onChange={e => setDate(e.target.value)} /><button className="primary" onClick={addWorkout}>Lưu buổi tập</button></div>{msg && <p className="message">{msg}</p>}</div></section>}
        {tab !== 'Overview' && tab !== 'Finance' && tab !== 'Gym' && <section className="content-panel"><span className="eyebrow">LIFEOS</span><h2>{tab}</h2><p className="muted">Khu vực {tab} đang được kết nối với LifeOS.</p></section>}
      </section>
    </main>
  )
}

function Stat({ icon, label, value, note, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small className={tone}>{note}</small></div><b className="arrow">›</b></div>
}

function FinanceChart() {
  const bars = [16, 9, 6, 20, 8, 10, 6, 42, 25, 8]
  return <div className="chart-card"><div className="card-head"><div><h3>Tổng quan tài chính</h3><small>Triệu (₫)</small></div><div className="legend"><span>● Thu nhập</span><span>● Chi tiêu</span></div></div><div className="bars">{bars.map((h, i) => <div className="bar-col" key={i}><div className="bar income-bar" style={{height: `${h}px`}}></div><div className="bar expense-bar" style={{height: `${Math.max(5, h / 2)}px`}}></div><small>{i + 1}/9</small></div>)}</div></div>
}

function SpendChart() {
  return <div className="chart-card spend"><div className="card-head"><h3>Phân bổ chi tiêu</h3></div><div className="donut"><div><strong>4,041,000 ₫</strong><small>Tháng này</small></div></div><ul><li><i className="dot d1" />Nhà ở <b>56.9%</b></li><li><i className="dot d2" />Ăn uống <b>18.8%</b></li><li><i className="dot d3" />Mua sắm <b>6.7%</b></li><li><i className="dot d4" />Di chuyển <b>6.2%</b></li><li><i className="dot d5" />Gia đình <b>5.4%</b></li><li><i className="dot d6" />Khác <b>6.0%</b></li></ul></div>
}

function GymCard() { return <div className="mini-card"><div className="card-head"><h3>Gym gần đây</h3><button className="link-btn">Xem tất cả</button></div><div className="gym-row"><span className="round-icon">♢</span><div><b>Leg Day</b><small>10/09/2026</small><em>Squat 4×12 (190kg)</em><em>Nhún chân 30×30 (30kg)</em></div></div></div> }
function NutritionCard() { return <div className="mini-card nutrition"><div className="card-head"><h3>Dinh dưỡng hôm nay</h3><button className="link-btn">Thêm món ›</button></div><div className="nutrition-body"><div className="cal-ring"><strong>1,250</strong><small>/ 2,000 kcal</small></div><div className="macros"><Macro name="Protein" value="62g / 150g" width="42%" /><Macro name="Carbs" value="180g / 250g" width="72%" /><Macro name="Fat" value="40g / 70g" width="57%" /></div></div></div> }
function Macro({ name, value, width }) { return <div><span>{name} <b>{value}</b></span><i><em style={{width}} /></i></div> }
function FundCard() { return <div className="mini-card"><div className="card-head"><h3>Quỹ tiết kiệm</h3><button className="link-btn">Xem chi tiết</button></div><div className="fund-row"><span className="round-icon">✦</span><div><b>Quỹ khẩn cấp</b><strong>8,000,000 ₫</strong><small>Mục tiêu: 8,000,000 ₫</small></div><span className="shield">✓</span></div><div className="progress"><i style={{width:'100%'}} /></div></div> }
function ActivityCard({ transactions }) { const rows = transactions.slice(0, 4); return <div className="wide-card"><div className="card-head"><h3>Hoạt động gần đây</h3><button className="link-btn">Xem tất cả</button></div>{rows.length ? rows.map(t => <div className="activity" key={t.id}><span className={Number(t.amount) > 0 ? 'activity-icon up' : 'activity-icon down'}>{Number(t.amount) > 0 ? '↑' : '↓'}</span><div><b>{Number(t.amount) > 0 ? 'Thu nhập' : 'Chi tiêu'}</b><small>{t.description}</small></div><strong className={Number(t.amount) > 0 ? 'positive' : 'negative'}>{money(Math.abs(t.amount))}</strong></div>) : <div className="empty">Chưa có giao dịch gần đây.</div>}</div> }
function GoalsCard() { return <div className="wide-card"><div className="card-head"><h3>Mục tiêu tháng 9</h3><button className="link-btn">Chỉnh sửa</button></div><Goal icon="✦" name="Tiết kiệm" value="8,000,000 / 10,000,000 ₫" percent="80%" width="80%" /><Goal icon="♢" name="Tập gym" value="12 / 16 buổi" percent="75%" width="75%" /><Goal icon="♡" name="Dinh dưỡng" value="1,250 / 2,000 kcal" percent="63%" width="63%" /></div> }
function Goal({ icon, name, value, percent, width }) { return <div className="goal"><span className="round-icon">{icon}</span><div><b>{name}</b><small>{value}</small><i><em style={{width}} /></i></div><strong>{percent}</strong></div> }

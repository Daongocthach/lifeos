'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

export default function Page() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState('Overview')
  const [msg, setMsg] = useState('')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [income, setIncome] = useState(false)
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [weight, setWeight] = useState('')
  const [exercise, setExercise] = useState('')
  const [exercises, setExercises] = useState([])

  useEffect(() => {
    db.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const x = db.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    return () => x.data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) db.from('exercises').select('id,name').order('name').then(({ data }) => setExercises(data || []))
  }, [user])

  async function login() {
    const r = await db.auth.signInWithPassword({ email, password })
    setMsg(r.error?.message || '')
  }

  async function signup() {
    const r = await db.auth.signUp({ email, password })
    setMsg(r.error?.message || 'Check your email.')
  }

  async function addTx() {
    const r = await db.from('finance_transactions').insert({
      user_id: user.id,
      occurred_on: date,
      description: desc,
      category_id: income ? 'a8c62218-aeee-46fc-91ae-5602719303d5' : '8199b7a5-6605-42d3-839d-2a84ecd90a91',
      amount: (income ? 1 : -1) * Number(amount),
    })
    setMsg(r.error?.message || 'Saved')
    if (!r.error) { setAmount(''); setDesc('') }
  }

  async function addWorkout() {
    const s = await db.from('workout_sessions').insert({ user_id: user.id, workout_date: date, name: 'Workout' }).select('id').single()
    if (s.error) { setMsg(s.error.message); return }
    const rows = Array.from({ length: Number(sets) }, (_, i) => ({ session_id: s.data.id, exercise_id: exercise, set_number: i + 1, weight_kg: weight ? Number(weight) : null, reps: Number(reps) }))
    const r = await db.from('workout_sets').insert(rows)
    setMsg(r.error?.message || 'Workout saved')
  }

  if (!user) return (
    <main className="auth"><div className="authbox"><div className="logo">L</div><h1>LifeOS</h1><p>Personal operating system</p>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <small>{msg}</small>}
      <button onClick={login}>Sign in</button><button className="ghost" onClick={signup}>Create account</button>
    </div></main>
  )

  return <main className="app"><aside><div className="brand"><b>◈ LifeOS</b></div>{['Overview','Finance','Gym','Nutrition'].map(x => <button className={tab === x ? 'nav active' : 'nav'} onClick={() => setTab(x)} key={x}>{x}</button>)}<div className="account"><small>{user.email}</small><button className="ghost" onClick={() => db.auth.signOut()}>Sign out</button></div></aside>
    <section className="main"><header><div><small>PERSONAL DASHBOARD</small><h1>{tab}</h1></div><span className="status">● Connected</span></header>
      {tab === 'Overview' && <div className="cards"><div className="card big"><small>LIFEOS</small><h2>One place for your life.</h2><p>Finance, workouts and nutrition synced with Supabase.</p></div><div className="card"><small>QUICK ENTRY</small><div className="quick"><button onClick={() => { setIncome(false); setTab('Finance') }}>＋ Expense</button><button onClick={() => { setIncome(true); setTab('Finance') }}>＋ Income</button><button onClick={() => setTab('Gym')}>＋ Workout</button></div></div></div>}
      {tab === 'Finance' && <section className="panel"><h2>{income ? 'Add income' : 'Add expense'}</h2><div className="form"><input type="number" placeholder="Amount (VND)" value={amount} onChange={e => setAmount(e.target.value)} /><input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} /><input type="date" value={date} onChange={e => setDate(e.target.value)} /><button onClick={addTx}>Save {income ? 'income' : 'expense'}</button><button className="ghost" onClick={() => setIncome(!income)}>Switch to {income ? 'expense' : 'income'}</button></div>{msg && <p>{msg}</p>}</section>}
      {tab === 'Gym' && <section className="panel"><h2>Log workout</h2><div className="form"><select value={exercise} onChange={e => setExercise(e.target.value)}><option value="">Select exercise</option>{exercises.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input type="number" placeholder="Weight kg" value={weight} onChange={e => setWeight(e.target.value)} /><input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} /><input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} /><input type="date" value={date} onChange={e => setDate(e.target.value)} /><button onClick={addWorkout}>Save workout</button></div>{msg && <p>{msg}</p>}</section>}
      {tab === 'Nutrition' && <section className="panel"><h2>Nutrition</h2><p>Connects to meals, daily_meals and daily_nutrition.</p></section>}
    </section></main>
}

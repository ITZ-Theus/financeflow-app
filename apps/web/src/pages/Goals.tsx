import { useState } from 'react'
import { Plus, Target, Trash2, CheckCircle } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals'
import { formatCurrency, formatDate } from '../utils/formatters'

export function Goals() {
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ title: '', targetAmount: '', deadline: '' })
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositValue, setDepositValue]   = useState('')

  const { data: goals, isLoading } = useGoals()
  const createMutation  = useCreateGoal()
  const updateMutation  = useUpdateGoal()
  const deleteMutation  = useDeleteGoal()

  const depositGoal = goals?.find(g => g.id === depositGoalId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync({ title: form.title, targetAmount: Number(form.targetAmount), deadline: form.deadline })
    setForm({ title: '', targetAmount: '', deadline: '' })
    setShowForm(false)
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    if (!depositGoal) return
    await updateMutation.mutateAsync({ id: depositGoal.id, currentAmount: Number(depositGoal.currentAmount) + Number(depositValue) })
    setDepositGoalId(null)
    setDepositValue('')
  }

  const statusLabel: Record<string, string> = { active: 'Ativa', completed: 'Concluída', cancelled: 'Cancelada' }
  const statusColor: Record<string, string> = { active: 'var(--accent)', completed: 'var(--green)', cancelled: 'var(--red)' }

  return (
    <div style={{ padding: 32 }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Metas Financeiras</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Defina e acompanhe seus objetivos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Nova Meta
        </button>
      </div>

      {showForm && (
        <Modal title="Nova Meta" onClose={() => setShowForm(false)} maxWidth={440}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Título</label>
              <input className="input" placeholder="Ex: BMW M2" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Valor Alvo (R$)</label>
                <input className="input" type="number" step="0.01" placeholder="0,00" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Prazo</label>
                <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Criando...' : 'Criar Meta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {depositGoalId && depositGoal && (
        <Modal title="Adicionar valor à meta" onClose={() => setDepositGoalId(null)} maxWidth={360}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Meta: <strong style={{ color: 'var(--text-primary)' }}>{depositGoal.title}</strong>
          </p>
          <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" placeholder="0,00" value={depositValue} onChange={e => setDepositValue(e.target.value)} required autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setDepositGoalId(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={updateMutation.isLoading}>Confirmar</button>
            </div>
          </form>
        </Modal>
      )}

      {isLoading && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {goals?.map(g => {
          const pct = Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100)
          const sc  = statusColor[g.status]
          return (
            <div key={g.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {g.status === 'completed'
                    ? <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    : <Target size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{g.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}18`, border: `1px solid ${sc}30`, padding: '2px 8px', borderRadius: 20, fontFamily: 'Syne, sans-serif', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {statusLabel[g.status]}
                  </span>
                  <button onClick={() => deleteMutation.mutate(g.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progresso</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: g.status === 'completed' ? 'var(--green)' : 'linear-gradient(90deg, var(--accent), var(--cyan))', borderRadius: 3, transition: 'width 0.5s ease', boxShadow: '0 0 8px var(--accent-glow)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Acumulado</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', fontFamily: 'Syne, sans-serif' }}>{formatCurrency(Number(g.currentAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Meta</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{formatCurrency(Number(g.targetAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prazo</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(g.deadline)}</span>
              </div>

              {g.status === 'active' && (
                <button
                  onClick={() => { setDepositGoalId(g.id); setDepositValue('') }}
                  style={{ width: '100%', padding: '9px 0', background: 'var(--accent-glow)', border: '1px solid var(--border-glow)', borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#3b82f620')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-glow)')}
                >
                  + Adicionar valor
                </button>
              )}
            </div>
          )
        })}
        {goals?.length === 0 && !isLoading && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhuma meta criada ainda. Crie sua primeira meta!
          </div>
        )}
      </div>
    </div>
  )
}

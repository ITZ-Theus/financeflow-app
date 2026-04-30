import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Trash2, WalletCards } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { useCategories } from '../hooks/useCategories'
import { useBudgets, useCreateBudget, useDeleteBudget } from '../hooks/useBudgets'
import { formatCurrency, formatMonth } from '../utils/formatters'
import type { Budget, BudgetStatus } from '../types'

const statusLabel: Record<BudgetStatus, string> = {
  safe: 'Dentro do limite',
  warning: 'Perto do limite',
  exceeded: 'Limite estourado',
}

const statusColor: Record<BudgetStatus, string> = {
  safe: 'var(--green)',
  warning: 'var(--amber)',
  exceeded: 'var(--red)',
}

export function Budgets() {
  const now = new Date()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })

  const { data: categories } = useCategories()
  const { data: budgets, isLoading } = useBudgets({ month: form.month, year: form.year })
  const createMutation = useCreateBudget()
  const deleteMutation = useDeleteBudget()
  const expenseCategories = categories?.filter((category) => category.type === 'expense') ?? []
  const availableCategories = expenseCategories.filter((category) => !budgets?.some((budget) => budget.categoryId === category.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      await createMutation.mutateAsync({
        categoryId: form.categoryId,
        amount: Number(form.amount),
        month: form.month,
        year: form.year,
      })
      setForm((current) => ({ ...current, categoryId: '', amount: '' }))
      setShowForm(false)
    } catch {
      // Mutation onError already shows the toast.
    }
  }

  const totalBudgeted = budgets?.reduce((sum, budget) => sum + Number(budget.amount), 0) ?? 0
  const totalSpent = budgets?.reduce((sum, budget) => sum + Number(budget.spent), 0) ?? 0
  const usage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0

  return (
    <div className="dashboard-screen animate-in">
      <header className="page-header">
        <div>
          <span className="page-kicker">Planejamento mensal</span>
          <h2>Orcamentos</h2>
          <p>Defina limites por categoria e acompanhe seus gastos</p>
        </div>
        <button className="btn-primary inline-action" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Novo Orcamento
        </button>
      </header>

      <section className="stats-grid">
        <BudgetSummaryCard label="Limite planejado" value={formatCurrency(totalBudgeted)} />
        <BudgetSummaryCard label="Gasto acompanhado" value={formatCurrency(totalSpent)} tone={usage >= 100 ? 'red' : 'cyan'} />
        <BudgetSummaryCard label="Uso geral" value={`${usage}%`} tone={usage >= 100 ? 'red' : usage >= 80 ? 'amber' : 'green'} />
      </section>

      {showForm && (
        <Modal title="Novo Orcamento" onClose={() => setShowForm(false)} maxWidth={440}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Categoria de saida</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}
                required
              >
                <option value="">Selecione uma categoria</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Limite (R$)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Mes</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={(e) => setForm((current) => ({ ...current, month: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <label className="label">Ano</label>
                <input
                  className="input"
                  type="number"
                  min="2000"
                  max="2100"
                  value={form.year}
                  onChange={(e) => setForm((current) => ({ ...current, year: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={createMutation.isLoading || availableCategories.length === 0}>
                {createMutation.isLoading ? 'Criando...' : 'Criar Orcamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <section className="premium-panel activity-panel">
        <div className="panel-heading activity-panel__heading">
          <div>
            <span>{formatMonth(form.month, form.year)}</span>
            <h3>Limites por Categoria</h3>
          </div>
        </div>

        {isLoading && <div className="empty-row">Carregando...</div>}

        {!isLoading && budgets?.length === 0 && (
          <div className="empty-row">Nenhum orcamento criado para este mes</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: budgets?.length ? 20 : 0 }}>
          {budgets?.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onDelete={() => deleteMutation.mutate(budget.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function BudgetSummaryCard({ label, value, tone = 'cyan' }: { label: string; value: string; tone?: 'green' | 'red' | 'cyan' | 'amber' }) {
  const color = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : tone === 'amber' ? 'var(--amber)' : 'var(--cyan)'

  return (
    <div className="premium-panel stat-card" data-tone={tone === 'amber' ? 'red' : tone}>
      <div className="stat-card__top">
        <span>{label}</span>
        <div className="stat-card__icon" style={{ color }}><WalletCards size={18} /></div>
      </div>
      <strong style={{ color }}>{value}</strong>
      <div className="stat-card__signal">
        <span />
        <small>budget</small>
      </div>
    </div>
  )
}

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: () => void }) {
  const color = statusColor[budget.status]
  const progress = Math.min(100, budget.percentage)

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: `${budget.category.color}22`, border: `1px solid ${budget.category.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: budget.category.color }}>
            <CategoryIcon icon={budget.category.icon} size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>{budget.category.name}</h3>
            <p style={{ color, fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              {budget.status === 'safe' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {statusLabel[budget.status]}
            </p>
          </div>
        </div>
        <button className="icon-button danger" onClick={onDelete} aria-label="Excluir orcamento" type="button">
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Uso</span>
          <strong style={{ fontSize: 12, color }}>{budget.percentage.toFixed(0)}%</strong>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-surface)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: color, boxShadow: `0 0 10px ${color}`, transition: 'width 0.2s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <BudgetMetric label="Gasto" value={formatCurrency(budget.spent)} color={budget.status === 'exceeded' ? 'var(--red)' : 'var(--text-primary)'} />
        <BudgetMetric label="Limite" value={formatCurrency(Number(budget.amount))} />
        <BudgetMetric label="Restante" value={formatCurrency(budget.remaining)} color={budget.remaining < 0 ? 'var(--red)' : 'var(--green)'} />
        <BudgetMetric label="Periodo" value={`${String(budget.month).padStart(2, '0')}/${budget.year}`} />
      </div>
    </div>
  )
}

function BudgetMetric({ label, value, color = 'var(--text-primary)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</span>
      <strong style={{ color, fontSize: 13, fontFamily: 'Syne, sans-serif' }}>{value}</strong>
    </div>
  )
}

import { useState } from 'react'
import { Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useCreateTransaction, useDeleteTransaction, useTransactions } from '../hooks/useTransactions'
import { formatCurrency, formatDate } from '../utils/formatters'

export function Transactions() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  })

  const { data, isLoading } = useTransactions({ limit: 20 })
  const { data: categories } = useCategories()
  const createMutation = useCreateTransaction()
  const deleteMutation = useDeleteTransaction()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync({
      ...form,
      amount: Number(form.amount),
      categoryId: form.categoryId || undefined,
    })
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], description: '', categoryId: '' })
    setShowForm(false)
  }

  return (
    <div className="dashboard-screen animate-in">
      <header className="page-header">
        <div>
          <span className="page-kicker">Fluxo financeiro</span>
          <h2>Transacoes</h2>
          <p>Gerencie suas entradas e saidas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary inline-action"
        >
          <Plus size={16} />
          Nova Transacao
        </button>
      </header>

      {showForm && (
        <section className="premium-panel form-panel">
          <div className="panel-heading">
            <div>
              <span>Registro</span>
              <h3>Nova Transacao</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div>
              <label className="label">Titulo</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
              >
                <option value="income">Entrada</option>
                <option value="expense">Saida</option>
              </select>
            </div>

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categories?.filter((c) => c.type === form.type).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Descricao</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
                {createMutation.isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="premium-panel activity-panel">
        <div className="panel-heading activity-panel__heading">
          <div>
            <span>Historico</span>
            <h3>Movimentacoes recentes</h3>
          </div>
        </div>

        <div className="activity-list">
          {isLoading && <div className="empty-row">Carregando...</div>}
          {!isLoading && data?.data.length === 0 && (
            <div className="empty-row">Nenhuma transacao encontrada</div>
          )}
          {data?.data.map((t) => (
            <div key={t.id} className="activity-row transaction-row">
              <div className="transaction-row__main">
                <div className="transaction-row__icon" data-type={t.type}>
                  {t.type === 'income'
                    ? <TrendingUp size={16} />
                    : <TrendingDown size={16} />
                  }
                </div>
                <div>
                  <p>{t.title}</p>
                  <span>{formatDate(t.date)} / {t.category?.name || 'Sem categoria'}</span>
                </div>
              </div>
              <div className="transaction-row__side">
                <strong data-type={t.type}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                </strong>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="icon-button danger"
                  aria-label="Excluir transacao"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

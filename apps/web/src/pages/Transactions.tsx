import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { exportTransactionsCsv, useCreateTransaction, useDeleteTransaction, useTransactions, useUpdateTransaction } from '../hooks/useTransactions'
import { toast } from '../store/toastStore'
import { formatCurrency, formatDate } from '../utils/formatters'
import type { Transaction, TransactionType } from '../types'
import type { TransactionFilters } from '../hooks/useTransactions'

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  const amount = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  return Number(normalized)
}

function formatAmountForForm(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

const months = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2026, index, 1)),
}))

const pageSize = 20

export function Transactions() {
  const now = new Date()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    type: '' as '' | TransactionType,
    categoryId: '',
  })
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  })

  const filterParams: TransactionFilters = {
    month: filters.month,
    year: filters.year,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
  }

  const transactionParams: TransactionFilters = {
    ...filterParams,
    page,
    limit: pageSize,
  }

  const { data, isLoading } = useTransactions(transactionParams)
  const { data: categories } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()
  const [exporting, setExporting] = useState(false)
  const filterCategories = categories?.filter((category) => !filters.type || category.type === filters.type) ?? []
  const totalPages = data?.totalPages || 1
  const currentPage = data?.page || page

  useEffect(() => {
    setPage(1)
  }, [filters.month, filters.year, filters.type, filters.categoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        amount: parseCurrencyInput(form.amount),
        categoryId: form.categoryId || null,
      }

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }

      closeForm()
    } catch {
      // Mutation onError already shows the toast.
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportTransactionsCsv(filterParams)
      toast.success('Exportacao concluida', 'Suas transacoes foram baixadas em CSV.')
    } catch {
      toast.error('Erro ao exportar', 'Nao foi possivel gerar o arquivo CSV.')
    } finally {
      setExporting(false)
    }
  }

  function resetFilters() {
    setFilters({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      type: '',
      categoryId: '',
    })
  }

  function openCreateForm() {
    setEditingId(null)
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], description: '', categoryId: '' })
    setShowForm(true)
  }

  function openEditForm(transaction: Transaction) {
    setEditingId(transaction.id)
    setForm({
      title: transaction.title,
      amount: formatAmountForForm(transaction.amount),
      type: transaction.type,
      date: transaction.date,
      description: transaction.description || '',
      categoryId: transaction.categoryId || '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setEditingId(null)
    setForm({ title: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], description: '', categoryId: '' })
    setShowForm(false)
  }

  const saving = createMutation.isLoading || updateMutation.isLoading

  return (
    <div className="dashboard-screen animate-in">
      <header className="page-header">
        <div>
          <span className="page-kicker">Fluxo financeiro</span>
          <h2>Transacoes</h2>
          <p>Gerencie suas entradas e saidas</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            onClick={handleExport}
            className="btn-ghost inline-action"
            disabled={exporting}
          >
            <Download size={16} />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={openCreateForm}
            className="btn-primary inline-action"
          >
            <Plus size={16} />
            Nova Transacao
          </button>
        </div>
      </header>

      <section className="premium-panel filter-panel">
        <div className="panel-heading">
          <div>
            <span>Filtros</span>
            <h3>Periodo e categoria</h3>
          </div>
        </div>

        <div className="filter-grid">
          <div>
            <label className="label">Mes</label>
            <select
              className="input"
              value={filters.month}
              onChange={(e) => setFilters((current) => ({ ...current, month: Number(e.target.value) }))}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Ano</label>
            <input
              className="input"
              type="number"
              min="2000"
              max="2100"
              value={filters.year}
              onChange={(e) => setFilters((current) => ({ ...current, year: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters((current) => ({ ...current, type: e.target.value as '' | TransactionType, categoryId: '' }))}
            >
              <option value="">Todos</option>
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={filters.categoryId}
              onChange={(e) => setFilters((current) => ({ ...current, categoryId: e.target.value }))}
            >
              <option value="">Todas</option>
              {filterCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <button type="button" className="btn-ghost filter-reset" onClick={resetFilters}>
            Limpar
          </button>
        </div>
      </section>

      {showForm && (
        <section className="premium-panel form-panel">
          <div className="panel-heading">
            <div>
              <span>Registro</span>
              <h3>{editingId ? 'Editar Transacao' : 'Nova Transacao'}</h3>
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
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: formatCurrencyInput(e.target.value) })}
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
              <button type="button" onClick={closeForm} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : editingId ? 'Salvar Alteracoes' : 'Salvar'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="premium-panel activity-panel">
        <div className="panel-heading activity-panel__heading">
          <div>
            <span>Historico</span>
            <h3>Movimentacoes filtradas</h3>
          </div>
          <strong className="result-count">
            {data?.total ?? 0} registro(s)
            {data?.total ? ` / pagina ${currentPage} de ${totalPages}` : ''}
          </strong>
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
                  onClick={() => openEditForm(t)}
                  className="icon-button"
                  aria-label="Editar transacao"
                  type="button"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="icon-button danger"
                  aria-label="Excluir transacao"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="pagination-bar">
            <button
              type="button"
              className="btn-ghost inline-action"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <span>Pagina {currentPage} de {totalPages}</span>
            <button
              type="button"
              className="btn-ghost inline-action"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage >= totalPages || isLoading}
            >
              Proxima
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

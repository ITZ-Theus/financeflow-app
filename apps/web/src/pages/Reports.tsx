import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange, FilterX, Gauge, ReceiptText, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCategories } from '../hooks/useCategories'
import { useFinancialReport } from '../hooks/useReports'
import { formatCompactCurrency, formatCurrency, formatDate } from '../utils/formatters'
import type { ReportCategoryItem, ReportTransactionItem, TransactionType } from '../types'

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const tooltipStyle = {
  background: 'rgba(9, 15, 28, 0.96)',
  border: '1px solid rgba(125, 211, 252, 0.25)',
  borderRadius: 8,
  color: '#f8fafc',
  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)',
}

function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultFilters() {
  const now = new Date()
  return {
    startDate: toDateInput(new Date(now.getFullYear(), now.getMonth() - 5, 1)),
    endDate: toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    type: '' as '' | TransactionType,
    categoryId: '',
  }
}

function formatMonthLabel(month: number, year: number) {
  return `${monthLabels[month - 1]}/${String(year).slice(-2)}`
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function getCurrencyTone(value: number): 'green' | 'red' | 'cyan' {
  if (value > 0) return 'green'
  if (value < 0) return 'red'
  return 'cyan'
}

function ReportMetricCard({
  label,
  value,
  tone,
  icon,
  detail,
}: {
  label: string
  value: string
  tone: 'green' | 'red' | 'cyan'
  icon: ReactNode
  detail: string
}) {
  return (
    <div className="premium-panel stat-card" data-tone={tone}>
      <div className="panel-sheen" />
      <div className="stat-card__top">
        <span>{label}</span>
        <div className="stat-card__icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <div className="stat-card__signal">
        <span />
        <small>{detail}</small>
      </div>
    </div>
  )
}

function CategoryRankRow({ category, maxTotal }: { category: ReportCategoryItem; maxTotal: number }) {
  const width = maxTotal > 0 ? Math.max((category.total / maxTotal) * 100, 4) : 0

  return (
    <div className="report-rank-row">
      <div className="report-rank-row__top">
        <div>
          <span className="report-dot" style={{ background: category.color }} />
          <strong>{category.name}</strong>
          <small>{category.type === 'income' ? 'Entrada' : 'Saida'}</small>
        </div>
        <div>
          <strong>{formatCurrency(category.total)}</strong>
          <small>{formatPercent(category.percentage)}</small>
        </div>
      </div>
      <div className="report-meter">
        <span style={{ width: `${width}%`, background: category.color }} />
      </div>
    </div>
  )
}

function TransactionRankRow({ transaction }: { transaction: ReportTransactionItem }) {
  const isIncome = transaction.type === 'income'

  return (
    <div className="report-transaction-row">
      <div className="transaction-row__main">
        <div className="transaction-row__icon" data-type={transaction.type}>
          {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
        </div>
        <div>
          <p>{transaction.title}</p>
          <span>{transaction.categoryName} • {formatDate(transaction.date)}</span>
        </div>
      </div>
      <strong data-type={transaction.type}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</strong>
    </div>
  )
}

export function Reports() {
  const [filters, setFilters] = useState(getDefaultFilters)
  const { data: categories } = useCategories()
  const availableCategories = categories?.filter((category) => !filters.type || category.type === filters.type) ?? []
  const reportParams = useMemo(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
  }), [filters])
  const { data: report, isLoading } = useFinancialReport(reportParams)
  const monthlyData = report?.monthly.map((item) => ({
    ...item,
    label: formatMonthLabel(item.month, item.year),
  })) ?? []
  const hasMonthlyData = monthlyData.some((item) => item.income > 0 || item.expense > 0)
  const maxCategoryTotal = Math.max(...(report?.categories.map((category) => category.total) ?? [0]))

  function resetFilters() {
    setFilters(getDefaultFilters())
  }

  return (
    <div className="dashboard-screen animate-in" data-testid="reports-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Analise financeira</span>
          <h2>Relatorios</h2>
          <p>{report ? `${formatDate(report.period.startDate)} ate ${formatDate(report.period.endDate)}` : 'Periodo personalizado'}</p>
        </div>
      </header>

      <section className="premium-panel filter-panel">
        <div className="panel-heading">
          <div>
            <span>Filtros</span>
            <h3>Periodo e categoria</h3>
          </div>
          <CalendarRange size={18} />
        </div>

        <div className="filter-grid report-filter-grid">
          <div>
            <label className="label">Inicio</label>
            <input
              className="input"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Fim</label>
            <input
              className="input"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))}
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
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <button type="button" className="btn-ghost filter-reset inline-action" onClick={resetFilters}>
            <FilterX size={16} />
            Limpar
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <ReportMetricCard
          label="Entradas"
          value={formatCurrency(report?.totals.income || 0)}
          tone="green"
          icon={<ArrowUpRight size={18} />}
          detail={`${report?.totals.transactionCount || 0} movimentacoes`}
        />
        <ReportMetricCard
          label="Saidas"
          value={formatCurrency(report?.totals.expense || 0)}
          tone="red"
          icon={<ArrowDownRight size={18} />}
          detail={`media ${formatCurrency(report?.totals.averageTransaction || 0)}`}
        />
        <ReportMetricCard
          label="Saldo"
          value={formatCurrency(report?.totals.balance || 0)}
          tone={getCurrencyTone(report?.totals.balance || 0)}
          icon={<Wallet size={18} />}
          detail={`economia ${formatPercent(report?.totals.savingsRate || 0)}`}
        />
      </section>

      <section className="premium-panel trend-panel">
        <div className="panel-heading">
          <div>
            <span>Evolucao</span>
            <h3>Tendencia por Mes</h3>
          </div>
          <BarChart3 size={18} />
        </div>

        {isLoading && <div className="empty-state empty-state--compact">Carregando...</div>}

        {!isLoading && hasMonthlyData && (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 16, right: 16, left: 18, bottom: 0 }}>
              <defs>
                <linearGradient id="reportIncome" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="reportExpense" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="reportBalance" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={76}
              />
              <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.18)" />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="income" name="Entradas" stroke="#2dd4bf" fill="url(#reportIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Saidas" stroke="#fb7185" fill="url(#reportExpense)" strokeWidth={2} />
              <Area type="monotone" dataKey="balance" name="Saldo" stroke="#38bdf8" fill="url(#reportBalance)" strokeWidth={2} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {!isLoading && !hasMonthlyData && (
          <div className="empty-state empty-state--compact">
            <div className="empty-state__ring" />
            <span>Nenhuma movimentacao encontrada no periodo</span>
          </div>
        )}
      </section>

      <section className="report-detail-grid">
        <div className="premium-panel report-panel">
          <div className="panel-heading">
            <div>
              <span>Categorias</span>
              <h3>Ranking Financeiro</h3>
            </div>
            <Gauge size={18} />
          </div>

          {report?.categories.length ? (
            <div className="report-rank-list">
              {report.categories.map((category) => (
                <CategoryRankRow key={`${category.type}-${category.categoryId || category.name}`} category={category} maxTotal={maxCategoryTotal} />
              ))}
            </div>
          ) : (
            <div className="empty-row">Nenhuma categoria no periodo</div>
          )}
        </div>

        <div className="premium-panel report-panel">
          <div className="panel-heading">
            <div>
              <span>Movimentacoes</span>
              <h3>Maiores Valores</h3>
            </div>
            <ReceiptText size={18} />
          </div>

          {report?.topTransactions.length ? (
            <div className="report-transaction-list">
              {report.topTransactions.map((transaction) => (
                <TransactionRankRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="empty-row">Nenhuma transacao no periodo</div>
          )}
        </div>
      </section>
    </div>
  )
}

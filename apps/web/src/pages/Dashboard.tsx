import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, DollarSign, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSummary, useTransactions } from '../hooks/useTransactions'
import { formatCompactCurrency, formatCurrency, formatDate } from '../utils/formatters'

const COLORS = ['#2dd4bf', '#f43f5e', '#a3e635', '#f59e0b', '#38bdf8', '#e879f9']

const tooltipStyle = {
  background: 'rgba(9, 15, 28, 0.96)',
  border: '1px solid rgba(125, 211, 252, 0.25)',
  borderRadius: 8,
  color: '#f8fafc',
  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)',
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: string
  tone: 'green' | 'red' | 'cyan'
  icon: ReactNode
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
        <small>live</small>
      </div>
    </div>
  )
}

export function Dashboard() {
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  const { data: summary } = useSummary({ month, year })
  const { data: recentTransactions } = useTransactions({ month, year, limit: 5 })
  const expenseByCategory = summary?.expensesByCategory?.filter((c) => c.value > 0) || []

  const barData = [
    { name: 'Entradas', value: summary?.income || 0, fill: '#2dd4bf' },
    { name: 'Saidas', value: -(summary?.expense || 0), fill: '#f43f5e' },
    { name: 'Saldo', value: summary?.balance || 0, fill: '#38bdf8' },
  ]

  return (
    <div className="dashboard-screen animate-in">
      <header className="page-header">
        <div>
          <span className="page-kicker">FinanceFlow OS</span>
          <h2>Dashboard</h2>
          <p>Resumo do mes atual</p>
        </div>
        <div className="status-chip">
          <span />
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Entradas"
          value={formatCurrency(summary?.income || 0)}
          tone="green"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Saidas"
          value={formatCurrency(summary?.expense || 0)}
          tone="red"
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          label="Saldo"
          value={formatCurrency(summary?.balance || 0)}
          tone={(summary?.balance || 0) >= 0 ? 'cyan' : 'red'}
          icon={<DollarSign size={18} />}
        />
      </section>

      <section className="charts-grid">
        <div className="premium-panel chart-panel">
          <div className="panel-heading">
            <div>
              <span>Fluxo</span>
              <h3>Resumo Mensal</h3>
            </div>
            <ArrowUpRight size={18} />
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 18, right: 12, left: 18, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={76}
              />
              <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.18)" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(125, 211, 252, 0.06)' }} formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="value" radius={[8, 8, 4, 4]} barSize={42}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="premium-panel chart-panel">
          <div className="panel-heading">
            <div>
              <span>Categoria</span>
              <h3>Gastos por Categoria</h3>
            </div>
            <ArrowUpRight size={18} />
          </div>

          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} innerRadius={48} paddingAngle={4}>
                  {expenseByCategory.map((item, i) => (
                    <Cell key={item.categoryId || item.name} fill={item.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state__ring" />
              <span>Nenhum gasto registrado</span>
            </div>
          )}
        </div>
      </section>

      <section className="premium-panel activity-panel">
        <div className="panel-heading activity-panel__heading">
          <div>
            <span>Movimento</span>
            <h3>Ultimas Transacoes</h3>
          </div>
          <a href="/transactions" className="action-link">
            <Plus size={15} />
            Ver todas
          </a>
        </div>

        <div className="activity-list">
          {recentTransactions?.data.length === 0 && (
            <div className="empty-row">Nenhuma transacao este mes</div>
          )}
          {recentTransactions?.data.map((t) => (
            <div key={t.id} className="activity-row">
              <div>
                <p>{t.title}</p>
                <span>{formatDate(t.date)} / {t.category?.name || 'Sem categoria'}</span>
              </div>
              <strong data-type={t.type}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

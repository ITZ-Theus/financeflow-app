import { useState } from 'react'
import { Pencil, Plus, Trash2, Tag } from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import { Modal } from '../components/ui/Modal'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { useCategories, useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import { api } from '../services/api'
import { toast } from '../store/toastStore'
import { getApiErrorMessage } from '../utils/apiError'
import type { Category } from '../types'

const PRESET_COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#8b5cf6', '#f43f5e', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

const PRESET_ICONS = [
  'shopping-cart', 'utensils', 'car', 'home', 'pill', 'plane', 'book-open', 'lightbulb',
  'music', 'shirt', 'briefcase', 'gift', 'wallet', 'fuel', 'laptop', 'smartphone', 'graduation-cap', 'paw-print',
]

const initialForm = {
  name: '',
  color: '#3b82f6',
  icon: 'tag',
  type: 'expense' as 'income' | 'expense',
}

export function Categories() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const { data: categories, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const qc = useQueryClient()

  const deleteMutation = useMutation(
    async (id: string) => { await api.delete(`/categories/${id}`) },
    {
      onSuccess: () => {
        qc.invalidateQueries('categories')
        qc.invalidateQueries('transactions')
        qc.invalidateQueries('summary')
        toast.success('Categoria removida', 'As transacoes vinculadas ficaram como Sem categoria.')
      },
      onError: (error) => {
        toast.error('Erro ao remover categoria', getApiErrorMessage(error))
      },
    }
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingCategoryId) {
        await updateMutation.mutateAsync({ id: editingCategoryId, ...form })
      } else {
        await createMutation.mutateAsync(form)
      }

      setEditingCategoryId(null)
      setShowForm(false)
    } catch {
      // Mutation onError already shows the toast.
    }
  }

  function openCreateForm() {
    setForm(initialForm)
    setEditingCategoryId(null)
    setShowForm(true)
  }

  function openEditForm(category: Category) {
    setForm({
      name: category.name,
      color: category.color,
      icon: category.icon,
      type: category.type,
    })
    setEditingCategoryId(category.id)
    setShowForm(true)
  }

  function closeForm() {
    setEditingCategoryId(null)
    setShowForm(false)
  }

  const income = categories?.filter((c) => c.type === 'income') ?? []
  const expense = categories?.filter((c) => c.type === 'expense') ?? []

  return (
    <div style={{ padding: 32 }} className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Categorias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Organize suas transacoes por categoria</p>
        </div>
        <button className="btn-primary" onClick={openCreateForm} style={{ display: 'flex', alignItems: 'center', gap: 6 }} data-testid="new-category-button">
          <Plus size={15} /> Nova Categoria
        </button>
      </div>

      {showForm && (
        <Modal title={editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'} onClose={closeForm}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} data-testid="category-form">
            <div>
              <label className="label">Tipo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['income', 'expense'] as const).map((type) => {
                  const active = form.type === type
                  const color = type === 'income' ? 'var(--green)' : 'var(--red)'
                  const glow = type === 'income' ? 'var(--green-glow)' : 'var(--red-glow)'

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, type }))}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${active ? color : 'var(--border)'}`, background: active ? glow : 'transparent', color: active ? color : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}
                    >
                      {type === 'income' ? 'Entrada' : 'Saida'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="label">Nome</label>
              <input className="input" placeholder="Ex: Alimentacao" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required data-testid="category-name-input" />
            </div>

            <div>
              <label className="label">Icone</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, icon }))}
                    style={{ width: 38, height: 38, borderRadius: 8, cursor: 'pointer', border: `1px solid ${form.icon === icon ? 'var(--accent)' : 'var(--border)'}`, background: form.icon === icon ? 'var(--accent-glow)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s', color: form.icon === icon ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    <CategoryIcon icon={icon} size={18} />
                  </button>
                ))}
              </div>
              <input className="input" placeholder="Ou digite uma chave de icone" value={form.icon} onChange={(e) => setForm((current) => ({ ...current, icon: e.target.value }))} />
            </div>

            <div>
              <label className="label">Cor</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, color }))}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: color, cursor: 'pointer', border: form.color === color ? '3px solid #fff' : '3px solid transparent', boxShadow: form.color === color ? `0 0 12px ${color}99` : 'none', transition: 'all 0.15s' }}
                  />
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: `${form.color}22`, border: `1px solid ${form.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.color }}>
                {form.icon ? <CategoryIcon icon={form.icon} size={18} /> : <Tag size={16} />}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{form.name || 'Nome da categoria'}</p>
                <p style={{ fontSize: 12, marginTop: 2, color: form.type === 'income' ? 'var(--green)' : 'var(--red)' }}>{form.type === 'income' ? 'Entrada' : 'Saida'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={closeForm}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={createMutation.isLoading || updateMutation.isLoading} data-testid="save-category-button">
                {editingCategoryId
                  ? updateMutation.isLoading ? 'Salvando...' : 'Salvar Alteracoes'
                  : createMutation.isLoading ? 'Criando...' : 'Criar Categoria'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isLoading && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</p>}

      {income.length > 0 && (
        <CategorySection
          title="Entradas"
          tone="income"
          categories={income}
          onEdit={openEditForm}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

      {expense.length > 0 && (
        <CategorySection
          title="Saidas"
          tone="expense"
          categories={expense}
          onEdit={openEditForm}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

      {categories?.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
          Nenhuma categoria criada ainda. Crie uma para organizar suas transacoes!
        </div>
      )}
    </div>
  )
}

function CategorySection({
  title,
  tone,
  categories,
  onEdit,
  onDelete,
}: {
  title: string
  tone: 'income' | 'expense'
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}) {
  const color = tone === 'income' ? 'var(--green)' : 'var(--red)'
  const lineColor = tone === 'income' ? '#10b98144' : '#f43f5e44'

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${lineColor}, transparent)` }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => onEdit(category)}
            onDelete={() => onDelete(category.id)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} data-testid="category-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `${category.color}22`, border: `1px solid ${category.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: category.color }}>
          <CategoryIcon icon={category.icon} size={17} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{category.name}</p>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: category.color, marginTop: 4, boxShadow: `0 0 6px ${category.color}` }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onEdit} className="icon-button" aria-label="Editar categoria" type="button">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="icon-button danger" aria-label="Excluir categoria" type="button">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BrandMark } from '../components/ui/BrandMark'

export function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <BrandMark />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #fff, var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FinanceFlow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Crie sua conta gratuitamente</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, fontFamily: 'Syne, sans-serif' }}>Criar conta</h2>

          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Nome</label>
              <input className="input" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

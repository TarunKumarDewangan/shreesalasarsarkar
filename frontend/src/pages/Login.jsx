import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Building2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Building2 size={26} color="var(--primary)" />
          </div>
          <h2>Shree Salasar Sarkar</h2>
          <p>Finance Management System</p>
        </div>

        {error && <div className="alert alert--error" style={{marginBottom:'14px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-fields">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={loading} style={{marginTop:'8px',width:'100%',justifyContent:'center'}}>
            <LogIn size={16} />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

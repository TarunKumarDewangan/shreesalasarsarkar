import { useState } from 'react'
import { Phone, Hash, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import api from '../api'

export default function BorrowerLogin() {
  const [mobile, setMobile] = useState('')
  const [useOtp, setUseOtp] = useState(true)
  const [otpValue, setOtpValue] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async () => {
    if (mobile.length < 10) return setError('Invalid mobile number')
    setLoading(true)
    setError('')
    try {
      await api.post('/borrower/send-otp', { mobile })
      setOtpSent(true)
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/borrower/login', {
        mobile,
        type: useOtp ? 'OTP' : 'FOLIO',
        value: otpValue
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.borrower))
      localStorage.setItem('role', 'BORROWER')
      window.location.href = '/borrower/dashboard'
    } catch (ex) {
      setError(ex.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'var(--primary)', color: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.3)' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Borrower Portal</h2>
          <p style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>Check your loan details securely</p>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 13, textAlign: 'center', border: '1px solid #fee2e2' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, opacity: 0.6 }}>Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input 
                type="tel" 
                className="form-control" 
                style={{ paddingLeft: 48, borderRadius: 12, height: 50, fontSize: 16 }} 
                placeholder="Enter registered mobile" 
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button 
              type="button" 
              onClick={() => { setUseOtp(true); setOtpSent(false); }}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid ' + (useOtp ? 'var(--primary)' : 'transparent'), background: useOtp ? 'rgba(var(--primary-rgb), 0.05)' : 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: useOtp ? 'var(--primary)' : 'inherit' }}
            >
              OTP Login
            </button>
            <button 
              type="button" 
              onClick={() => setUseOtp(false)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid ' + (!useOtp ? 'var(--primary)' : 'transparent'), background: !useOtp ? 'rgba(var(--primary-rgb), 0.05)' : 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: !useOtp ? 'var(--primary)' : 'inherit' }}
            >
              Folio Number
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, opacity: 0.6 }}>
              {useOtp ? 'Verification Code (OTP)' : 'Folio Number'}
            </label>
            <div style={{ position: 'relative' }}>
              <Hash size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: 48, borderRadius: 12, height: 50, fontSize: 16 }} 
                placeholder={useOtp ? '4-digit OTP' : 'Enter Folio No.'}
                value={otpValue}
                onChange={e => setOtpValue(e.target.value)}
                required
              />
              {useOtp && !otpSent && (
                <button 
                  type="button" 
                  onClick={sendOtp}
                  disabled={loading}
                  style={{ position: 'absolute', right: 8, top: 7, height: 36, padding: '0 16px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {loading ? '...' : 'Get OTP'}
                </button>
              )}
              {useOtp && otpSent && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }}>
                  <CheckCircle2 size={18} />
                </div>
              )}
            </div>
            {useOtp && otpSent && <p style={{ fontSize: 11, color: '#16a34a', marginTop: 8, margin: '8px 0 0' }}>OTP has been sent to your WhatsApp</p>}
          </div>

          <button 
            type="submit" 
            className="btn btn--primary" 
            style={{ width: '100%', height: 52, borderRadius: 14, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Access My Account'} <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

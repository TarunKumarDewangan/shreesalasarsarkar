import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { MessageSquare, Save, Send, ShieldCheck, AlertCircle, Building2, Key, Hash, Activity, Zap, Check, ExternalLink, Loader2 } from 'lucide-react'

export default function WhatsAppSettings() {
    const { isAdmin, user } = useAuth()
    const [settings, setSettings] = useState({
        instance_id: '',
        access_token: '',
        is_active: true
    })
    const [financers, setFinancers] = useState([])
    const [selectedFinancerId, setSelectedFinancerId] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testMobile, setTestMobile] = useState('')
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        if (isAdmin) {
            api.get('/financers').then(r => {
                setFinancers(r.data)
                if (r.data.length > 0) {
                    setSelectedFinancerId(r.data[0].id)
                }
            })
        } else {
            loadSettings()
        }
    }, [isAdmin])

    useEffect(() => {
        if (isAdmin && selectedFinancerId) {
            loadSettings(selectedFinancerId)
        }
    }, [selectedFinancerId])

    const loadSettings = (financerId = null) => {
        setLoading(true)
        const params = financerId ? { financer_id: financerId } : {}
        api.get('/whatsapp/settings', { params })
            .then(r => {
                if (r.data.settings) {
                    setSettings({
                        instance_id: r.data.settings.instance_id || '',
                        access_token: r.data.settings.access_token || '',
                        is_active: !!r.data.settings.is_active
                    })
                } else {
                    setSettings({ instance_id: '', access_token: '', is_active: true })
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Failed to load settings' }))
            .finally(() => setLoading(false))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: '', text: '' })
        try {
            const payload = {
                ...settings,
                financer_id: isAdmin ? selectedFinancerId : user.id
            }
            await api.post('/whatsapp/settings', payload)
            setMessage({ type: 'success', text: 'Configuration saved and activated!' })
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        if (!testMobile) {
            setMessage({ type: 'error', text: 'Please enter a mobile number for testing' })
            return
        }
        setTesting(true)
        setMessage({ type: '', text: '' })
        try {
            const res = await api.post('/whatsapp/test', {
                instance_id: settings.instance_id,
                access_token: settings.access_token,
                mobile: testMobile
            })
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Test message delivered! Please check WhatsApp.' })
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Transmission failed' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error or invalid API details' })
        } finally {
            setTesting(false)
        }
    }

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }} className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1>WhatsApp Automation</h1>
                    <p>Manage your Iconic Solution API integration for automated alerts</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div className={`badge badge--${settings.is_active ? 'success' : 'danger'}`} style={{ padding: '6px 16px', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                     <Activity size={12} style={{ marginRight: 6 }} /> {settings.is_active ? 'SERVICE ACTIVE' : 'SERVICE OFF'}
                   </div>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert--${message.type === 'error' ? 'error' : 'success'} animate-in`} style={{ marginBottom: 32, padding: '16px 20px', borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: message.type === 'error' ? 'var(--danger-bg)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                           {message.type === 'error' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
                        </div>
                        <span style={{ fontWeight: 600 }}>{message.text}</span>
                    </div>
                </div>
            )}

            <div className="grid-1" style={{ gap: 32 }}>
                <div className="card shadow-md" style={{ borderRadius: 20, overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '24px 32px', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Zap size={20} className="text-primary" />
                            <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>API CONFIGURATION</span>
                        </div>
                        {loading && <Loader2 className="animate-spin text-primary" size={18} />}
                    </div>
                    <div className="card-body" style={{ padding: 32 }}>
                        {isAdmin && (
                            <div className="form-group" style={{ marginBottom: 32 }}>
                                <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: 'var(--primary)' }}>SELECT FINANCER ACCOUNT</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                                    <select 
                                        className="form-control" 
                                        style={{ paddingLeft: 48, height: 48, borderRadius: 12, fontWeight: 600 }}
                                        value={selectedFinancerId} 
                                        onChange={e => setSelectedFinancerId(e.target.value)}
                                    >
                                        {financers.map(f => (
                                            <option key={f.id} value={f.id}>{f.finance_name} ({f.name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div className="grid-2" style={{ gap: 32 }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: 'var(--text-muted)' }}>INSTANCE ID</label>
                                    <div style={{ position: 'relative' }}>
                                        <Hash size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                                        <input 
                                            type="text" 
                                            className="form-control no-caps" 
                                            style={{ paddingLeft: 48, height: 48, borderRadius: 12, background: 'var(--surface)' }}
                                            placeholder="Instance ID from panel" 
                                            value={settings.instance_id}
                                            onChange={e => setSettings({...settings, instance_id: e.target.value})}
                                        />
                                    </div>
                                    <p style={{ fontSize: 11, marginTop: 8, opacity: 0.6 }}>Found in your Iconic Solution dashboard.</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 800, fontSize: 11, color: 'var(--text-muted)' }}>SERVICE API KEY</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                                        <input 
                                            type="text" 
                                            className="form-control no-caps" 
                                            style={{ paddingLeft: 48, height: 48, borderRadius: 12, background: 'var(--surface)' }}
                                            placeholder="Enter Developer API Key" 
                                            value={settings.access_token}
                                            onChange={e => setSettings({...settings, access_token: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <p style={{ fontSize: 11, marginTop: 8, opacity: 0.6 }}>Primary credential for message delivery.</p>
                                </div>
                            </div>

                            <div style={{ marginTop: 16, padding: '20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                   <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Check size={20} className={settings.is_active ? 'text-success' : 'text-muted'} />
                                   </div>
                                   <div>
                                      <div style={{ fontWeight: 800, fontSize: 14 }}>Enable Auto-Notifications</div>
                                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>System will send messages on new payments</div>
                                   </div>
                                </div>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.is_active}
                                        onChange={e => setSettings({...settings, is_active: e.target.checked})}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <button type="submit" className="btn btn--primary" disabled={saving || loading} style={{ width: '100%', marginTop: 32, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 800, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}>
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} style={{ marginRight: 10 }} />}
                                {saving ? 'Applying Changes...' : 'Update Configuration'}
                            </button>
                        </form>
                    </div>
                </div>

                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    <div className="card shadow-sm" style={{ borderRadius: 20 }}>
                        <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               <Send size={18} className="text-primary" />
                               <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>TEST CONNECTIVITY</span>
                            </div>
                        </div>
                        <div className="card-body" style={{ padding: 24 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                                Send a live test message to verify your API credentials.
                            </p>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        style={{ height: 44, borderRadius: 10, paddingLeft: 12 }}
                                        placeholder="Mobile (e.g. 91...)" 
                                        value={testMobile}
                                        onChange={e => setTestMobile(e.target.value)}
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn--secondary" 
                                    onClick={handleTest} 
                                    disabled={testing}
                                    style={{ height: 44, padding: '0 20px', borderRadius: 10, fontWeight: 700 }}
                                >
                                    {testing ? <Loader2 className="animate-spin" /> : 'Send Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

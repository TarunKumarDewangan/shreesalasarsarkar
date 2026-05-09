import React, { useState, useEffect } from 'react'
import api from '../api'
import { Activity, Search, User, Calendar, Shield, Info } from 'lucide-react'

const CSS = `
  .logs-container { padding: 30px; }
  .logs-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
  .logs-hdr { padding: 20px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
  .logs-title { font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; }
  
  .logs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .logs-table th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; }
  .logs-table td { padding: 14px 15px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .logs-table tr:hover { background: #f8fafc; }

  .action-badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.3px; }
  .action-delete { background: #fee2e2; color: #991b1b; }
  .action-create { background: #dcfce7; color: #166534; }
  .action-update { background: #e0f2fe; color: #075985; }
  .action-other { background: #f1f5f9; color: #475569; }

  .payload-box { max-width: 300px; max-height: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help; color: #64748b; font-family: monospace; font-size: 11px; }
  .payload-full { position: relative; }
  .payload-full:hover .payload-tooltip { display: block; }
  .payload-tooltip { display: none; position: absolute; bottom: 100%; left: 0; background: #1e293b; color: white; padding: 15px; border-radius: 8px; z-index: 100; width: 400px; white-space: pre-wrap; font-size: 11px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #334155; }

  .filters { display: flex; gap: 15px; margin-bottom: 20px; }
  .filter-input { flex: 1; position: relative; }
  .filter-input input { width: 100%; padding: 10px 15px 10px 40px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; transition: 0.2s; }
  .filter-input input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .filter-ic { position: absolute; left: 14px; top: 11px; color: #94a3b8; }

  .pagination { display: flex; justify-content: center; gap: 10px; padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .page-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
`

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/audit-logs?page=${page}&action=${search}`)
      setLogs(res.data.data)
      setMeta(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 500)
    return () => clearTimeout(timer)
  }, [page, search])

  const getActionClass = (action) => {
    if (action.includes('DELETED')) return 'action-delete'
    if (action.includes('CREATED')) return 'action-create'
    if (action.includes('UPDATED') || action.includes('EDITED')) return 'action-update'
    return 'action-other'
  }

  return (
    <div className="logs-container">
      <style>{CSS}</style>
      
      <div className="filters no-print">
        <div className="filter-input">
          <Search size={16} className="filter-ic" />
          <input 
            type="text" 
            placeholder="Search actions (e.g. DELETE, BORROWER)..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="logs-card">
        <div className="logs-hdr">
          <div className="logs-title">
            <Activity size={20} color="#3b82f6" />
            System Audit Logs
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            Total Events: {meta?.total || 0}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}><Calendar size={12} style={{ marginRight: 6 }}/> Timestamp</th>
                <th style={{ width: 140 }}><User size={12} style={{ marginRight: 6 }}/> User</th>
                <th style={{ width: 140 }}>< Shield size={12} style={{ marginRight: 6 }}/> Role</th>
                <th style={{ width: 180 }}>Action</th>
                <th style={{ width: 140 }}>Model</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No logs found matching your criteria.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td style={{ fontWeight: 700 }}>{log.user?.name || 'System'}</td>
                  <td>
                    <span style={{ 
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      color: log.user?.role === 'admin' ? '#ef4444' : '#3b82f6'
                    }}>
                      {log.user?.role || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`action-badge ${getActionClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 10, color: '#64748b' }}>
                    {log.model_type?.split('\\').pop()} #{log.model_id}
                  </td>
                  <td className="payload-full">
                    <div className="payload-box">
                      {JSON.stringify(log.payload)}
                    </div>
                    <div className="payload-tooltip">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 8 }}>
                        <Info size={14} color="#3b82f6" />
                        <span style={{ fontWeight: 800, fontSize: 12 }}>FULL EVENT PAYLOAD</span>
                      </div>
                      <pre style={{ margin: 0 }}>{JSON.stringify(log.payload, null, 2)}</pre>
                      <div style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: 8 }}>
                        IP Address: {log.ip_address}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', fontWeight: 700, fontSize: 13, margin: '0 10px' }}>
              Page {page} of {meta.last_page}
            </span>
            <button 
              className="page-btn" 
              disabled={page === meta.last_page} 
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

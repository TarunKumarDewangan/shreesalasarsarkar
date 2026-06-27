import { useState } from 'react'
import api from '../../api'
import { 
  Download, UploadCloud, AlertTriangle, ShieldCheck, Database, 
  CheckCircle, Loader2, ArrowLeft, RefreshCw, FileText
} from 'lucide-react'

export default function BackupRestore() {
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [backupFile, setBackupFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  
  // Confirmation states for destructive action
  const [confirmCheckbox, setConfirmCheckbox] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleExport = async () => {
    setExporting(true)
    setError('')
    setSuccess('')
    try {
      // Direct stream download helper
      const response = await api.get('/backup/export', { responseType: 'blob' })
      
      // Extract filename from headers or default
      let filename = `sss_backup_${new Date().toISOString().slice(0, 10)}.json`
      const disposition = response.headers['content-disposition']
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '')
        }
      }

      // Create browser download link
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSuccess('Backup database file downloaded successfully.')
    } catch (err) {
      console.error(err)
      setError('Failed to download database backup.')
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setBackupFile(file)
    setPreviewData(null)
    setError('')
    setSuccess('')
    setPreviewing(true)

    const formData = new FormData()
    formData.append('backup_file', file)

    try {
      const res = await api.post('/backup/preview-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPreviewData(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to parse backup file preview.')
      setBackupFile(null)
    } finally {
      setPreviewing(false)
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!backupFile) return
    if (!confirmCheckbox || confirmText.trim().toUpperCase() !== 'RESTORE') {
      setError('Please complete the verification prompts before restoring data.')
      return
    }

    setImporting(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('backup_file', backupFile)

    try {
      const res = await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(res.data.message || 'System restore completed successfully.')
      // Reset form states
      setBackupFile(null)
      setPreviewData(null)
      setConfirmCheckbox(false)
      setConfirmText('')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Restore failed. Database rollback triggered.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="backup-restore-page">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>Backup &amp; Restore</h1>
          <p>Export the entire database or restore from a previous backup file.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert--danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={18} style={{ marginRight: 8 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert--success" style={{ marginBottom: 20 }}>
          <CheckCircle size={18} style={{ marginRight: 8 }} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* EXPORT PANEL */}
        <div className="card shadow-sm" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Download size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Export Database</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Download a complete snapshot of all tables.</p>
            </div>
          </div>

          <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <p style={{ fontSize: 13, lineHeight: '1.6', color: '#475569' }}>
              The exported file is a compressed JSON structure including all system tables (Financers, Users, Borrowers, Vehicles, Guarantors, Loans, Installments, Recoveries, Backlogs, and Audit Logs).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                <ShieldCheck size={14} className="text-success" />
                <span>Password hashes remain securely encrypted.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                <FileText size={14} className="text-primary" />
                <span>Does not back up physical files/images in storage directory.</span>
              </div>
            </div>
          </div>

          <button 
            className="btn btn--primary btn--lg" 
            style={{ width: '100%', justifyContent: 'center' }} 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" size={18} style={{ marginRight: 8 }} />
                Exporting Data...
              </>
            ) : (
              <>
                <Download size={18} style={{ marginRight: 8 }} />
                Download JSON Backup
              </>
            )}
          </button>
        </div>

        {/* IMPORT PANEL */}
        <div className="card shadow-sm" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Restore Database</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Destructively replace all data with a backup file.</p>
            </div>
          </div>

          {!backupFile ? (
            <div className="drag-upload-box" onClick={() => document.getElementById('backup-file-input').click()}>
              <UploadCloud size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Click to select backup file</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports only .json files exported from SSS</div>
              <input 
                id="backup-file-input" 
                type="file" 
                accept=".json" 
                hidden 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="import-wrapper animate-in">
              <div style={{ 
                background: '#f8fafc', border: '1px solid var(--border)', 
                borderRadius: 8, padding: 12, display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Database size={16} className="text-primary" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{backupFile.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({(backupFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  className="btn btn--ghost btn--sm" 
                  onClick={() => { setBackupFile(null); setPreviewData(null); }}
                  disabled={importing}
                >
                  Change
                </button>
              </div>

              {previewing && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <Loader2 className="animate-spin" size={24} style={{ marginRight: 8 }} />
                  <span>Analyzing backup schema...</span>
                </div>
              )}

              {previewData && (
                <div className="backup-preview-details">
                  <div style={{ fontSize: 12, background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', color: '#15803d', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700 }}>Backup Verified Successfully</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      Exported on {new Date(previewData.exported_at).toLocaleString()} by {previewData.exported_by.name}
                    </div>
                  </div>

                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Tables to Restore</h3>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 20 }}>
                    <table className="table" style={{ margin: 0, fontSize: 12 }}>
                      <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                          <th>Table Name</th>
                          <th style={{ textAlign: 'center' }}>Records in Backup</th>
                          <th style={{ textAlign: 'center' }}>Existing Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.summary.map(s => (
                          <tr key={s.table}>
                            <td><strong>{s.table}</strong></td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: s.backup_records > 0 ? 'var(--primary)' : 'inherit' }}>
                              {s.backup_records}
                            </td>
                            <td style={{ textAlign: 'center', opacity: 0.6 }}>{s.current_records}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* DESTROY WARNING PANEL */}
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <AlertTriangle size={18} className="text-danger" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 13 }}>CRITICAL WARNING: DATA WIPE</div>
                        <div style={{ color: '#991b1b', fontSize: 11, lineHeight: '1.5', marginTop: 4 }}>
                          Restoring from backup is <strong>destructive</strong>. All current records across the 13 tables will be permanently deleted and replaced.
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, borderTop: '1px solid #fecaca', paddingTop: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, cursor: 'pointer', color: '#7f1d1d', fontWeight: 600 }}>
                        <input 
                          type="checkbox" 
                          style={{ marginTop: 2 }} 
                          checked={confirmCheckbox} 
                          onChange={(e) => setConfirmCheckbox(e.target.checked)} 
                        />
                        <span>I understand that this action is irreversible and will replace all active data.</span>
                      </label>
                    </div>

                    {confirmCheckbox && (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', fontSize: 10, color: '#7f1d1d', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                          Type RESTORE to confirm:
                        </label>
                        <input 
                          type="text" 
                          className="form-control form-control--sm" 
                          placeholder="type RESTORE" 
                          style={{ borderColor: '#fca5a5' }}
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn btn--danger btn--lg" 
                    style={{ width: '100%', justifyContent: 'center' }} 
                    disabled={importing || !confirmCheckbox || confirmText.trim().toUpperCase() !== 'RESTORE'}
                    onClick={handleImport}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} style={{ marginRight: 8 }} />
                        Restoring System Data...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} style={{ marginRight: 8 }} />
                        Execute Full System Restore
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .drag-upload-box {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          background: #f8fafc;
        }
        .drag-upload-box:hover {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.05);
        }
        .backup-restore-page {
          max-width: 1100px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  )
}

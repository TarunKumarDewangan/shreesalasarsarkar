import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Search, Loader2, User, Car, ChevronDown, Wallet } from 'lucide-react'

export default function LiveSearchInput({ placeholder = "Search borrower or vehicle...", className = "", onSearch, onSelect, onQuickAction }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const nav = useNavigate()
  const wrapperRef = useRef(null)

  useEffect(() => {
    onSearch?.(q)
  }, [q])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShow(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // If hidden, don't fetch
    if (!show) return

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await api.get('/search/global', { params: { q } })
        setResults(r.data)
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setLoading(false)
      }
    }, q.length < 2 ? 0 : 400) // Immediate for empty, debounced for typing

    return () => clearTimeout(timer)
  }, [q, show])

  const handleSelect = (res) => {
    setShow(false)
    setQ('')
    if (onSelect) {
      onSelect(res)
    } else if (res.loan_id) {
      nav(`/loans/${res.loan_id}`)
    } else {
      nav(`/borrowers?id=${res.id}`)
    }
  }

  return (
    <div className={`live-search-wrapper ${className}`} ref={wrapperRef}>
      <div className="search-input-group">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setShow(true)}
        />
        <div 
          className="search-arrow-btn" 
          onClick={() => setShow(!show)}
          style={{ cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={14} className={show ? 'rotate-180' : ''} style={{ transition: 'transform .2s', color: 'var(--text-muted)' }} />
        </div>
        {loading && <Loader2 className="loading-icon animate-spin" size={16} style={{ right: 38 }} />}
      </div>

      {show && results.length > 0 && (
        <div className="search-dropdown shadow-lg">
          {q.length < 2 && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', padding: '4px 12px', opacity: 0.8 }}>RECENT RECORDS</div>}
          {results.map((res) => (
            <div key={res.id} className="search-item" onClick={() => handleSelect(res)}>
              <div className="item-icon">
                {res.type === 'LOAN' ? <Car size={16} /> : <User size={16} />}
              </div>
              <div className="item-content">
                <div className="item-title">
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{res.name}</span>
                  <span style={{ margin: '0 6px', color: '#cbd5e1' }}>/</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{res.mobile}</span>
                  <span style={{ margin: '0 6px', color: '#cbd5e1' }}>?</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 12 }}>{res.vehicle_no}</span>
                </div>
                <div className="item-sub" style={{ justifyContent: 'space-between' }}>
                  <span>{res.folio}</span>
                  {res.address && (
                    <span style={{ opacity: 0.8 }}>
                      {res.address.slice(0, 35)}{res.address.length > 35 ? '...' : ''}
                    </span>
                  )}
                </div>
              </div>
              {onQuickAction && res.loan_id && (
                <button 
                  className="btn btn--primary btn--xs item-quick-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction(res);
                  }}
                  title="Quick Pay Installment"
                  style={{ marginLeft: 8 }}
                >
                  <Wallet size={12} /> PAY
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {show && results.length === 0 && !loading && (
        <div className="search-dropdown no-results" style={{ textAlign: 'left', padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>QUICK SEARCH</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {q.length < 2 ? 'Type name, mobile or vehicle no. to see suggestions...' : `No matches found for "${q}"`}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Search, User, Clock, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const { data } = await api.get(`/universal-search?q=${query}`)
        setResults(data.results)
        setIsOpen(true)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (url) => {
    setIsOpen(false)
    setQuery('')
    navigate(url)
  }

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search Borrowers, FNO, Mobile, Vehicle No..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {loading ? (
          <Loader2 className="spinner" size={18} />
        ) : query && (
          <button className="clear-btn" onClick={() => { setQuery(''); setResults([]); }}>
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((res, i) => (
            <div key={i} className="search-item" onClick={() => handleSelect(res.url)}>
              <div className={`item-icon ${res.icon}`}>
                {res.icon === 'user' ? <User size={16} /> : <Clock size={16} />}
              </div>
              <div className="item-content">
                <div className="item-title">{res.title}</div>
                <div className="item-sub">{res.subtitle}</div>
              </div>
              <div className="item-type">{res.type}</div>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="search-results no-results">
          No records found for "{query}"
        </div>
      )}
    </div>
  )
}

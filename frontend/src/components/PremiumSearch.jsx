import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, User, Phone, MapPin, Sparkles, Command } from 'lucide-react'

export default function PremiumSearch({ 
  placeholder = "Search anything... (Press / to focus)", 
  onSearch, 
  onSelect,
  results = [],
  loading = false
}) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setShowDropdown(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    onSearch?.(query)
    if (query.length > 0) setShowDropdown(true)
  }, [query])

  const handleClear = () => {
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
    onSearch?.('')
  }

  const handleItemSelect = (item) => {
    onSelect?.(item)
    setShowDropdown(false)
    setQuery('')
  }

  return (
    <div 
      className={`premium-search ${isFocused ? 'premium-search--focused' : ''}`} 
      ref={wrapperRef}
    >
      <div className="premium-search__input-wrapper">
        <div className="premium-search__icon">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="premium-search__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            if (query.length > 0 || results.length > 0) setShowDropdown(true)
          }}
          onBlur={() => setIsFocused(false)}
        />

        <div className="premium-search__shortcut">
          <Command size={10} style={{ marginRight: 2 }} /> /
        </div>

        <button 
          className={`premium-search__clear ${query ? 'premium-search__clear--visible' : ''}`}
          onClick={handleClear}
          type="button"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      </div>

      {showDropdown && (query.length > 0 || results.length > 0) && (
        <div className="premium-search__dropdown">
          <div className="premium-search__results">
            {results.length > 0 ? (
              <>
                <div className="premium-search__section-title">Matches Found ({results.length})</div>
                {results.map((item) => (
                  <div 
                    key={item.id} 
                    className="premium-search__item"
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="premium-search__item-avatar">
                      {item.type === 'CUSTOMER' ? <User size={18} /> : <Sparkles size={18} />}
                    </div>
                    <div className="premium-search__item-info">
                      <div className="premium-search__item-name">{item.name}</div>
                      <div className="premium-search__item-sub">
                        <Phone size={10} /> {item.mobile || 'No Mobile'}
                        <span style={{ opacity: 0.3 }}>•</span>
                        <MapPin size={10} /> {item.address?.substring(0, 30)}...
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : query.length > 0 && !loading ? (
              <div className="premium-search__no-results">
                <Search size={32} />
                <p>No matches found for <strong>"{query}"</strong></p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

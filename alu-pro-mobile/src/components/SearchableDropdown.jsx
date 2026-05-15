import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

const SearchableDropdown = ({ items, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedItem = items.find((item) => item.id === value)

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 transition-all hover:border-[#5C54A4]"
      >
        <span
          className={`truncate text-sm font-bold ${selectedItem ? 'text-[#2B3674]' : 'text-gray-400'}`}
        >
          {selectedItem ? selectedItem.name : placeholder}
        </span>
        <ChevronDown size={16} className="min-w-[16px] text-gray-400" />
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
          dir="rtl"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 p-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent text-sm font-bold outline-none"
              placeholder="ابحث عن الصنف..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="custom-scrollbar max-h-48 overflow-y-auto bg-white">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-center text-xs font-bold text-gray-400">لا توجد نتائج</div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="flex cursor-pointer items-center justify-between border-b border-gray-50 px-3 py-2 transition-colors last:border-0 hover:bg-indigo-50"
                >
                  <span className="text-sm font-bold text-[#2B3674]">{item.name}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-500">{item.price} ر.س</span>
                    <span
                      className={`text-[10px] font-black ${item.stockQty < 0 ? 'text-red-500' : 'text-green-500'}`}
                      dir="ltr"
                    >
                      الرصيد: {item.stockQty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableDropdown

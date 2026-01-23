import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { blogService } from '../../modules/blog/services/blogService'

export default function MegaMenu({ doctorSlug, primaryColor }) {
  const [menuItems, setMenuItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const itemRefs = useRef({})

  useEffect(() => {
    if (doctorSlug) {
      loadMenu()
    }
  }, [doctorSlug])

  const loadMenu = async () => {
    try {
      const items = await blogService.getMegaMenu(doctorSlug)
      setMenuItems(items || [])
    } catch (error) {
      console.error("Error loading mega menu:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseEnter = (slug) => {
    if (itemRefs.current[slug]) {
      itemRefs.current[slug].style.color = primaryColor
    }
  }

  const handleMouseLeave = (slug) => {
    if (itemRefs.current[slug]) {
      itemRefs.current[slug].style.color = ''
    }
  }

  if (loading || menuItems.length === 0) return null

  const itemsPerColumn = 10
  const columns = Math.ceil(menuItems.length / itemsPerColumn)
  const widthClass = columns > 1 ? (columns === 2 ? 'max-w-2xl' : 'max-w-4xl') : 'max-w-md'

  return (
    <div 
      className="relative group px-3 py-2"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium"
      >
        <span>Contenido</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 mt-0 w-screen ${widthClass} bg-white dark:bg-gray-800 shadow-xl rounded-lg ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-200 origin-top z-50 ${isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
      >
        <div className={`p-2 grid gap-x-4 gap-y-0.5`} style={{ gridTemplateRows: `repeat(${Math.min(menuItems.length, itemsPerColumn)}, min-content)`, gridAutoFlow: 'column' }}>
          {menuItems.map((item) => (
            <Link
              key={item.slug}
              to={`/dr/${doctorSlug}/blog/${item.slug}`}
              className="flex items-start px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition ease-in-out duration-150 group/item"
              onMouseEnter={() => handleMouseEnter(item.slug)}
              onMouseLeave={() => handleMouseLeave(item.slug)}
            >
              <div className="truncate w-full">
                <p 
                  ref={(el) => itemRefs.current[item.slug] = el}
                  className="text-base font-normal text-gray-900 dark:text-white transition-colors truncate"
                >
                  {item.menu_icon || item.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

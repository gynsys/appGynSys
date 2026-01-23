import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiShoppingBag, FiInfo } from 'react-icons/fi'
import { FaAmazon, FaPaypal, FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa'
import { recommendationService } from '../../services/recommendationService'
import Modal from '../common/Modal'

export default function RecommendationsCarousel({ doctorSlug, primaryColor = '#4F46E5', isDarkMode }) {
    const [items, setItems] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    // Filtering
    const [activeTab, setActiveTab] = useState('all') // 'all' or category_id

    // Carousel State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const carouselRef = useRef(null)

    // Autoplay Ref
    const autoplayRef = useRef(null)

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [itemsData, catsData] = await Promise.all([
                    recommendationService.getPublic(doctorSlug),
                    recommendationService.getPublicCategories(doctorSlug)
                ])
                setItems(itemsData)
                setCategories(catsData)
            } catch (err) {
                console.error("Error loading recommendations", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [doctorSlug])

    // Filter Items
    const filteredItems = activeTab === 'all'
        ? items.filter(i => i.is_active !== false)
        : items.filter(i => i.is_active !== false && i.category_id === activeTab)

    const itemCount = filteredItems.length

    // Reset Carousel on Tab Change
    useEffect(() => {
        setCurrentIndex(0)
    }, [activeTab])

    // Responsive Items per Slide
    const getItemsPerSlide = () => {
        if (typeof window === 'undefined') return 1
        if (window.innerWidth >= 1024) return 3 // Desktop: 3 items
        if (window.innerWidth >= 640) return 2  // Tablet: 2 items
        return 1                                // Mobile: 1 item
    }

    const [itemsPerSlide, setItemsPerSlide] = useState(getItemsPerSlide())

    useEffect(() => {
        const handleResize = () => setItemsPerSlide(getItemsPerSlide())
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Logic for Slide Navigation (Used ONLY when itemCount is 4-7)
    const maxIndex = Math.max(0, Math.ceil(itemCount / itemsPerSlide) - 1)

    const nextSlide = () => {
        setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
    }

    const prevSlide = () => {
        setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1))
    }

    if (loading) return null
    if (items.length === 0) return null

    // Calculate generic text/bg classes based on theme
    const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pink-100'
    const textColor = isDarkMode ? 'text-white' : 'text-gray-900'
    const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500'

    // Determine Render Mode based on Count
    // < 4: Static Grid
    // 4-7: Manual Slider with Arrows
    // >= 8: Marquee Infinite Scroll

    return (
        <section className="py-12 mb-16 bg-transparent border border-gray-100 dark:border-gray-800 rounded-3xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
                        Mis Recomendaciones
                    </h2>
                    <p className={`${subTextColor}`}>
                        Productos y recursos que seleccioné pensando en tu bienestar
                    </p>
                </div>

                {/* Categories Tabs */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'all'
                                ? 'shadow-md text-white'
                                : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'} border border-transparent`
                                }`}
                            style={activeTab === 'all' ? { backgroundColor: primaryColor } : {}}
                        >
                            General
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === cat.id
                                    ? 'shadow-md text-white'
                                    : `${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'} border border-transparent`
                                    }`}
                                style={activeTab === cat.id ? { backgroundColor: primaryColor } : {}}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* === CONTENT RENDERING LOGIC === */}

                {/* CASE 1: < 4 ITEMS (Static Grid) */}
                {itemCount < 4 && (
                    <div className="flex justify-center flex-wrap gap-6">
                        {filteredItems.map((item, index) => (
                            <div key={item.id} className="w-[240px] flex-shrink-0">
                                <CardItem
                                    item={item}
                                    setSelectedItem={setSelectedItem}
                                    cardBg={cardBg}
                                    textColor={textColor}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* CASE 2: 4 - 7 ITEMS (Manual Slider with Arrows) */}
                {itemCount >= 4 && itemCount < 8 && (
                    <div className="relative group">
                        {/* Arrows */}
                        <button
                            onClick={prevSlide}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 rounded-full shadow-lg transition-opacity ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'} opacity-0 group-hover:opacity-100`}
                        >
                            <FiChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 rounded-full shadow-lg transition-opacity ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'} opacity-0 group-hover:opacity-100`}
                        >
                            <FiChevronRight size={24} />
                        </button>

                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {/* We group items into 'slides' or just use itemsPerSlide? 
                                     Current manual logic uses full with slider per page?
                                     Actually, let's keep it simpler: Translate by 100% of container width per slide.
                                     
                                     We need to chunk items manually to match the standard slider logic, OR simply laying them out.
                                     Actually, standard slider approach:
                                     Slide 1: Items 0,1,2
                                     Slide 2: Items 3,4,5
                                     
                                     Let's recreate the 'slides'.
                                 */}
                                {Array.from({ length: Math.ceil(itemCount / itemsPerSlide) }).map((_, slideIndex) => (
                                    <div key={slideIndex} className="min-w-full flex justify-center gap-6">
                                        {filteredItems.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map(item => (
                                            <div key={item.id} className="w-[220px] sm:w-[240px] flex-shrink-0">
                                                <CardItem
                                                    item={item}
                                                    setSelectedItem={setSelectedItem}
                                                    cardBg={cardBg}
                                                    textColor={textColor}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CASE 3: >= 8 ITEMS (Infinite Marquee) */}
                {itemCount >= 8 && (
                    <div className="relative overflow-hidden w-full">
                        <style>{`
                            @keyframes marquee {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-33.333333%); }
                            }
                            .animate-marquee-infinite {
                                animation: marquee linear infinite;
                            }
                            .animate-marquee-infinite:hover {
                                animation-play-state: paused;
                            }
                        `}</style>
                        <div
                            className="flex gap-[28px] w-max animate-marquee-infinite"
                            style={{
                                animationDuration: `${filteredItems.length * (activeTab === 'all' ? 10 : 5)}s`
                            }}
                        >
                            {/* Duplicate items for infinite loop effect (Total 3 sets) */}
                            {[...filteredItems, ...filteredItems, ...filteredItems].map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className="flex-shrink-0 w-[220px] sm:w-[240px]"
                                >
                                    <CardItem
                                        item={item}
                                        setSelectedItem={setSelectedItem}
                                        cardBg={cardBg}
                                        textColor={textColor}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal de Detalle */}
                {selectedItem && (
                    <Modal
                        isOpen={!!selectedItem}
                        onClose={() => setSelectedItem(null)}
                        title=""
                        size="lg"
                        darkMode={isDarkMode}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="w-full flex flex-col">
                                <h2 className={`text-2xl font-bold mb-2 mt-0 pr-8 ${textColor}`}>
                                    {selectedItem.title}
                                </h2>

                                <div className="mb-6 pr-2 max-h-[60vh] overflow-y-auto">
                                    <p className={`text-base leading-relaxed ${subTextColor}`}>
                                        {selectedItem.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">

                                        <div className="flex flex-col">
                                            {selectedItem.price ? (
                                                <>
                                                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${subTextColor}`}>Precio</span>
                                                    <span className={`text-3xl font-bold ${textColor}`}>{selectedItem.price}</span>
                                                </>
                                            ) : <div></div>}
                                        </div>

                                        <a
                                            href={selectedItem.action_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-auto min-w-[200px] py-3 px-6 rounded-full font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            {(() => {
                                                if (selectedItem.action_type === 'PAYPAL') return <img src="/paypal-official.png" alt="PayPal" className="h-6 w-auto object-contain" />

                                                const url = selectedItem.action_url?.toLowerCase() || ''

                                                if (url.includes('amazon')) return <FaAmazon className="w-5 h-5 text-yellow-300" />
                                                if (url.includes('mercadolibre')) return <FiShoppingBag className="w-5 h-5 text-yellow-500" />
                                                if (url.includes('instagram')) return <img src="/instagram-logo.png" alt="Instagram" className="h-6 w-auto object-contain" />
                                                if (url.includes('tiktok')) return <img src="/tiktok-logo.png" alt="TikTok" className="h-6 w-auto object-contain" />
                                                if (url.includes('facebook')) return <img src="/facebook-logo.png" alt="Facebook" className="h-6 w-auto object-contain" />
                                                if (url.includes('youtube') || url.includes('youtu.be')) return <img src="/youtube-logo.png" alt="YouTube" className="h-6 w-auto object-contain" />
                                                if (url.includes('whatsapp')) return <FaWhatsapp className="w-5 h-5 text-green-300" />

                                                return <FiExternalLink className="w-5 h-5 text-white" />
                                            })()}

                                            <span>
                                                {(() => {
                                                    if (selectedItem.action_type === 'PAYPAL') return 'Comprar con PayPal'

                                                    const url = selectedItem.action_url?.toLowerCase() || ''
                                                    if (url.includes('amazon')) return 'Comprar en Amazon'
                                                    if (url.includes('mercadolibre')) return 'Comprar en MercadoLibre'
                                                    if (url.includes('instagram')) return 'Ver en Instagram'
                                                    if (url.includes('tiktok')) return 'Ver en TikTok'
                                                    if (url.includes('facebook')) return 'Ver en Facebook'
                                                    if (url.includes('youtube') || url.includes('youtu.be')) return 'Ver Video'
                                                    if (url.includes('whatsapp')) return 'Consultar'

                                                    return 'Ir al Sitio'
                                                })()}
                                            </span>
                                        </a>
                                    </div>
                                    {selectedItem.action_type === 'PAYPAL' && (
                                        <p className="text-right text-[10px] text-gray-400 mt-2 mr-2">
                                            Pago seguro procesado por PayPal
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </section>
    )
}

// Helper Component to avoid code duplication across the 3 render modes
const CardItem = ({ item, setSelectedItem, cardBg, textColor }) => (
    <div
        onClick={() => setSelectedItem(item)}
        className={`h-[320px] flex flex-col rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border cursor-pointer ${cardBg} hover:scale-[1.02]`}
    >
        <div className="h-40 relative overflow-hidden bg-white dark:bg-gray-700 pointer-events-none p-2">
            <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-contain"
            />
            {item.action_type === 'PAYPAL' && (
                <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    Oferta
                </span>
            )}
        </div>
        <div className="pt-4 px-3 pb-3 flex-1 flex flex-col pointer-events-none overflow-hidden">
            <h3 className={`font-bold text-sm mb-1 ${textColor}`} title={item.title}>
                {item.title}
            </h3>
            <p className={`text-xs mb-0 line-clamp-5 text-gray-500 text-justify`}>
                {item.description}
            </p>
        </div>
    </div>
)

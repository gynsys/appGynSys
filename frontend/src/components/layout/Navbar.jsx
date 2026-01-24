import { useAuthStore } from '../../store/authStore' // Added import

export default function Navbar({ doctor, primaryColor = '#4F46E5', onAppointmentClick, containerShadow = true, containerBgColor }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore() // Added auth hook

    // ... existing code ...

    < a
  href = "#preguntas-frecuentes"
  className = "text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white"
    >
    FAQ
              </a >

    {/* Authentication Logic */ }
  {
    isAuthenticated ? (
      <>
        <Link
          to="/dashboard"
          className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
        >
          Panel Admin
        </Link>
        <button
          onClick={() => logout()}
          className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </>
    ) : (
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="text-gray-700 hover:opacity-75 transition dark:text-gray-300 dark:hover:text-white font-medium"
      >
        Iniciar Sesión
      </button>
    )
  }

  {
    showBlog && (
      <MegaMenu doctorSlug={doctor?.slug_url} primaryColor={primaryColor} />
    )
  }
            </div >

    {/* Mobile Menu Button */ }
    < div className = "md:hidden flex items-center space-x-4" >
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-gray-700 hover:text-gray-900 focus:outline-none dark:text-gray-300 dark:hover:text-white"
      >
        {isMenuOpen ? (
          <FiX className="h-6 w-6" />
        ) : (
          <FiMenu className="h-6 w-6" />
        )}
      </button>
            </div >
          </div >

    {/* Mobile Menu */ }
  {
    isMenuOpen && (
      <div className="md:hidden py-4 space-y-3">
        <a
          href="#sobre-mi"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          Sobre Mí
        </a>
        <a
          href="#servicios"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          Servicios
        </a>
        <a
          href="#testimonios"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          Testimonios
        </a>
        <a
          href="#galeria"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          Galería
        </a>
        <a
          href="#ubicaciones"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          Ubicaciones
        </a>
        <a
          href="#preguntas-frecuentes"
          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          onClick={() => setIsMenuOpen(false)}
        >
          FAQ
        </a>
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Panel Admin
            </Link>
            <button
              onClick={() => {
                logout()
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setIsLoginModalOpen(true)
              setIsMenuOpen(false)
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Iniciar Sesión
          </button>
        )}
        {showBlog && (
          <Link
            to={`/dr/${doctor?.slug_url}/blog`}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Blog
          </Link>
        )}
        {showEndoTest && (
          <button
            onClick={() => {
              setIsTestModalOpen(true)
              setIsMenuOpen(false)
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Test Endometriosis
          </button>
        )}
        <button
          onClick={() => {
            onAppointmentClick()
            setIsMenuOpen(false)
          }}
          className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Agendar Cita
        </button>
      </div>
    )
  }
        </div >
    <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </nav >
    </>
  )
}


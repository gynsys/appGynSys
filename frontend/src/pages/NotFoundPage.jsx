import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4">Página no encontrada</h2>
        <p className="text-gray-600 mt-2 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}


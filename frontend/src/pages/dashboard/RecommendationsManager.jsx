import { useState, useEffect } from 'react'
import { FiTag, FiShoppingBag, FiExternalLink, FiDollarSign, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList } from 'react-icons/fi'
import { recommendationService } from '../../services/recommendationService'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import DragDropUpload from '../../components/features/DragDropUpload'
import { getImageUrl } from '../../lib/imageUtils'

export default function RecommendationsManager() {
    const { user } = useAuthStore()
    const { showToast } = useToastStore()
    const primaryColor = user?.theme_primary_color || '#4F46E5'

    const [activeTab, setActiveTab] = useState('items') // 'items' | 'categories'
    const [loading, setLoading] = useState(true)

    // Data
    const [items, setItems] = useState([])
    const [categories, setCategories] = useState([])

    // Modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Forms
    const [currentItem, setCurrentItem] = useState(null)
    const [itemForm, setItemForm] = useState({
        title: '',
        description: '',
        image_url: '',
        category_id: '',
        action_type: 'LINK', // 'LINK' | 'PAYPAL'
        action_url: '',
        price: '',
        is_active: true
    })

    const [categoryForm, setCategoryForm] = useState({
        name: ''
    })

    // Delete State
    const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null }) // { type: 'item'|'category', id: 1 }

    // Load Data
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [itemsData, categoriesData] = await Promise.all([
                recommendationService.getAll().catch(() => []),
                recommendationService.getCategories().catch(() => [])
            ])
            setItems(itemsData)
            setCategories(categoriesData)
        } catch (error) {
            showToast('Error al cargar datos. Asegúrate de tener el módulo activado.', 'error')
        } finally {
            setLoading(false)
        }
    }

    // --- Handlers: Items ---

    const handleOpenItemModal = (item = null) => {
        if (item) {
            setCurrentItem(item)
            setItemForm({
                title: item.title,
                description: item.description || '',
                image_url: item.image_url || '',
                category_id: item.category_id || '',
                action_type: item.action_type || 'LINK',
                action_url: item.action_url || '',
                price: item.price || '',
                is_active: item.is_active ?? true
            })
        } else {
            setCurrentItem(null)
            setItemForm({
                title: '',
                description: '',
                image_url: '',
                category_id: '',
                action_type: 'LINK',
                action_url: '',
                price: '',
                is_active: true
            })
        }
        setIsItemModalOpen(true)
    }

    const handleItemSubmit = async (e) => {
        e.preventDefault()
        try {
            // Prepare payload: convert empty category_id to null
            const payload = {
                ...itemForm,
                category_id: itemForm.category_id === '' ? null : parseInt(itemForm.category_id)
            }

            if (currentItem) {
                await recommendationService.update(currentItem.id, payload)
                showToast('Recomendación actualizada', 'success')
            } else {
                await recommendationService.create(payload)
                showToast('Recomendación creada', 'success')
            }
            setIsItemModalOpen(false)
            loadData() // Refresh both to be safe
        } catch (error) {
            showToast('Error al guardar: ' + (error.response?.data?.detail || error.message), 'error')
        }
    }

    // --- Handlers: Categories ---

    const handleOpenCategoryModal = () => {
        setCategoryForm({ name: '' })
        setIsCategoryModalOpen(true)
    }

    const handleCategorySubmit = async (e) => {
        e.preventDefault()
        try {
            await recommendationService.createCategory(categoryForm)
            showToast('Categoría creada', 'success')
            setIsCategoryModalOpen(false)
            loadData()
        } catch (error) {
            showToast('Error al crear categoría: ' + (error.response?.data?.detail || error.message), 'error')
        }
    }

    // --- Handlers: Delete ---

    const handleDeleteClick = (type, id) => {
        setDeleteTarget({ type, id })
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteTarget.id) return
        try {
            if (deleteTarget.type === 'item') {
                await recommendationService.delete(deleteTarget.id)
                showToast('Recomendación eliminada', 'success')
            } else {
                await recommendationService.deleteCategory(deleteTarget.id)
                showToast('Categoría eliminada', 'success')
            }
            setIsDeleteModalOpen(false)
            loadData()
        } catch (error) {
            showToast('Error al eliminar', 'error')
        }
    }

    if (loading) return <Spinner />

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiShoppingBag className="w-8 h-8 opacity-75" />
                            Gestión de Recomendaciones
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gestiona tus afiliados, eBooks y productos recomendados.
                        </p>
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('items')}
                            title="Selecciona para agregar items recomendados"
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'items' ? 'shadow-sm text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            style={activeTab === 'items' ? { backgroundColor: primaryColor } : {}}
                        >
                            <FiGrid /> Items
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            title="Selecciona para agregar nuevas categorias"
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'shadow-sm text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            style={activeTab === 'categories' ? { backgroundColor: primaryColor } : {}}
                        >
                            <FiList /> Categorías
                        </button>
                    </div>

                    <Button
                        onClick={() => activeTab === 'items' ? handleOpenItemModal() : handleOpenCategoryModal()}
                        style={{ backgroundColor: primaryColor }}
                    >
                        <FiPlus className="w-5 h-5 mr-1" />
                        {activeTab === 'items' ? 'Nueva Recomendación' : 'Nueva Categoría'}
                    </Button>
                </div>

                {/* --- ITEMS TAB --- */}
                {activeTab === 'items' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group">
                                <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img
                                            src={getImageUrl(item.image_url)}
                                            alt={item.title}
                                            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <FiShoppingBag className="w-12 h-12 opacity-30" />
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    {item.category_id && (
                                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                                            {categories.find(c => c.id === item.category_id)?.name || 'Categoría'}
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1" title={item.title}>
                                            {item.title}
                                        </h3>
                                        {!item.is_active && (
                                            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">Oculto</span>
                                        )}
                                    </div>

                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <span className="flex items-center gap-1">
                                            {item.action_type === 'PAYPAL' ? <FiDollarSign /> : <FiExternalLink />}
                                            {item.action_type === 'PAYPAL' ? 'Pago Directo' : 'Afiliado'}
                                        </span>
                                        {item.price && <span className="font-semibold text-gray-700 dark:text-gray-300">{item.price}</span>}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenItemModal(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                            title="Editar"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick('item', item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                    <FiShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin recomendaciones</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                                    Agrega productos, libros o servicios para mostrar en tu perfil público.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- CATEGORIES TAB --- */}
                {activeTab === 'categories' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Categorías Activas</span>
                                <span className="text-xs text-gray-500">Se mostrarán como pestañas en tu perfil</span>
                            </div>

                            {categories.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {categories.map(cat => (
                                        <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FiTag className="text-gray-400" />
                                                <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteClick('category', cat.id)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No tienes categorías creadas. Se usará solo "General".
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>

            {/* --- ITEM MODAL --- */}
            <Modal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                title={currentItem ? 'Editar Recomendación' : 'Nueva Recomendación'}
                size="xl"
            >
                <form onSubmit={handleItemSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Image Upload */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Imagen del Producto
                                </label>
                                <DragDropUpload
                                    type="recommendation-image"
                                    onUploadSuccess={(url) => setItemForm({ ...itemForm, image_url: url })}
                                    currentUrl={itemForm.image_url}
                                    primaryColor={primaryColor}
                                    compact={true}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
                                <select
                                    value={itemForm.category_id}
                                    onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">General (Sin categoría)</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio (Opcional)</label>
                                <input
                                    type="text"
                                    value={itemForm.price}
                                    onChange={e => {
                                        let val = e.target.value;
                                        if (val && !val.startsWith('$')) val = '$' + val;
                                        setItemForm({ ...itemForm, price: val });
                                    }}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej: $25.00"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={itemForm.is_active}
                                        onChange={e => setItemForm({ ...itemForm, is_active: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visible al público</span>
                                </label>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={itemForm.title}
                                    onChange={e => setItemForm({ ...itemForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej: Multivitamínico Premium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={itemForm.description}
                                    onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                    placeholder="Describe brevemente el producto..."
                                />
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuración de Acción</span>

                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="action_type"
                                            value="LINK"
                                            checked={itemForm.action_type === 'LINK'}
                                            onChange={() => setItemForm({ ...itemForm, action_type: 'LINK' })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm dark:text-gray-300">Enlace Externo / Afiliado</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="action_type"
                                            value="PAYPAL"
                                            checked={itemForm.action_type === 'PAYPAL'}
                                            onChange={() => setItemForm({ ...itemForm, action_type: 'PAYPAL' })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm dark:text-gray-300">Pago PayPal</span>
                                    </label>
                                </div>

                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {itemForm.action_type === 'LINK' ? 'URL de Destino' : 'Enlace de PayPal.me o Botón de Pago'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={itemForm.action_url}
                                    onChange={e => setItemForm({ ...itemForm, action_url: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="secondary" onClick={() => setIsItemModalOpen(false)} type="button">Cancelar</Button>
                        <Button type="submit" style={{ backgroundColor: primaryColor }}>Guardar</Button>
                    </div>
                </form>
            </Modal>

            {/* --- CATEGORY MODAL --- */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="Nueva Categoría"
                size="sm"
            >
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Pestaña</label>
                        <input
                            type="text"
                            required
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({ name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ej: eBooks, Suplementos..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} type="button">Cancelar</Button>
                        <Button type="submit" style={{ backgroundColor: primaryColor }}>Guardar</Button>
                    </div>
                </form>
            </Modal>

            {/* --- DELETE MODAL --- */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar eliminación"
                size="sm"
            >
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <FiTrash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ¿Estás seguro de que quieres eliminar este {deleteTarget.type === 'item' ? 'elemento' : 'categoría'}?
                        {deleteTarget.type === 'category' && ' Esto no borrará los items asociados, pero quedarán sin categoría.'}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Eliminar</Button>
                    </div>
                </div>
            </Modal>

        </div>
    )
}

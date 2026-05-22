import React, { useState, useEffect, useCallback } from 'react';
import { FiCpu, FiPlus, FiEdit2, FiTrash2, FiZap, FiCheckCircle, FiXCircle, FiLoader, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import GynSysLoader from '../../components/common/GynSysLoader';
import Modal from '../../components/common/Modal';

// ─────────────────────────────────────────────────────
// Provider type catalog — extend here for new providers
// ─────────────────────────────────────────────────────
const PROVIDER_TYPES = [
  { value: 'gemini',  label: 'Google Gemini',       placeholder: 'AIza...', baseUrlRequired: false },
  { value: 'groq',    label: 'Groq (Llama)',         placeholder: 'gsk_...', baseUrlRequired: true, defaultBaseUrl: 'https://api.groq.com/openai/v1' },
  { value: 'openai',  label: 'OpenAI',               placeholder: 'sk-proj-...', baseUrlRequired: false },
  { value: 'anthropic', label: 'Anthropic Claude',  placeholder: 'sk-ant-...', baseUrlRequired: false },
  { value: 'custom',  label: 'Custom (OpenAI-compatible)', placeholder: 'su_key...', baseUrlRequired: true, defaultBaseUrl: '' },
];

const USE_CASE_OPTIONS = [
  { value: 'all',    label: 'Todos (Blog + Social)' },
  { value: 'blog',   label: 'Solo Blog' },
  { value: 'social', label: 'Solo Social Media' },
];

const EMPTY_FORM = {
  provider_key: 'gemini',
  display_name: '',
  api_key: '',
  model_name: '',
  base_url: '',
  is_active: true,
  priority: 1,
  use_case: 'all',
  extra_params: null,
};

// ─────────────────────────────────────────────────────
// Provider icon badge
// ─────────────────────────────────────────────────────
function ProviderBadge({ providerKey }) {
  const icons = {
    gemini:    { bg: 'bg-blue-100', text: 'text-blue-600',  label: 'G' },
    groq:      { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Q' },
    openai:    { bg: 'bg-green-100', text: 'text-green-600', label: 'AI' },
    anthropic: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'A' },
    custom:    { bg: 'bg-gray-100', text: 'text-gray-600',  label: '?' },
  };
  const icon = icons[providerKey] || icons.custom;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${icon.bg} ${icon.text} flex-shrink-0`}>
      {icon.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function AdminLLMProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState({}); // { [providerId]: result }
  const [testingId, setTestingId] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [extraParamsText, setExtraParamsText] = useState('');

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getLLMProviders();
      setProviders(data);
    } catch (err) {
      console.error('[LLM Admin] Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  // Sync base_url default when provider_key changes
  const handleProviderKeyChange = (val) => {
    const type = PROVIDER_TYPES.find(t => t.value === val);
    setForm(f => ({
      ...f,
      provider_key: val,
      base_url: type?.defaultBaseUrl ?? f.base_url,
    }));
  };

  const openCreate = () => {
    setEditingProvider(null);
    setForm(EMPTY_FORM);
    setExtraParamsText('');
    setShowApiKey(false);
    setIsModalOpen(true);
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setForm({
      provider_key: provider.provider_key,
      display_name: provider.display_name,
      api_key: '', // Never pre-fill — user must type new key or leave blank to keep existing
      model_name: provider.model_name,
      base_url: provider.base_url || '',
      is_active: provider.is_active,
      priority: provider.priority,
      use_case: provider.use_case,
      extra_params: provider.extra_params,
    });
    setExtraParamsText(
      provider.extra_params ? JSON.stringify(provider.extra_params, null, 2) : ''
    );
    setShowApiKey(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.display_name.trim() || !form.model_name.trim()) return;
    if (!editingProvider && !form.api_key.trim()) return; // api_key required on create

    // Parse extra_params
    let extra_params = null;
    if (extraParamsText.trim()) {
      try {
        extra_params = JSON.parse(extraParamsText);
      } catch {
        alert('El JSON de parámetros extra no es válido.');
        return;
      }
    }

    const payload = { ...form, extra_params };
    // On edit: if api_key is blank, omit it so the backend preserves the existing one
    if (editingProvider && !payload.api_key?.trim()) {
      delete payload.api_key;
    }

    try {
      setIsSaving(true);
      if (editingProvider) {
        const updated = await adminService.updateLLMProvider(editingProvider.id, payload);
        setProviders(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await adminService.createLLMProvider(payload);
        setProviders(prev => [...prev, created].sort((a, b) => a.priority - b.priority));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('[LLM Admin] Save error:', err);
      alert(err.response?.data?.detail || 'Error al guardar el proveedor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (provider) => {
    setTestingId(provider.id);
    try {
      const result = await adminService.testLLMProvider(provider.id);
      setTestResults(prev => ({ ...prev, [provider.id]: result }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [provider.id]: { success: false, error: err.response?.data?.detail || 'Error de conexión' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminService.deleteLLMProvider(deleteTarget.id);
      setProviders(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el proveedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedType = PROVIDER_TYPES.find(t => t.value === form.provider_key);

  if (loading) return <GynSysLoader fullScreen={false} text="Cargando proveedores..." />;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiCpu className="text-indigo-600" />
            Configuración de IA
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Gestiona los proveedores de LLM utilizados para generar contenido de blog y redes sociales.
            Los proveedores se intentan en orden de prioridad con fallback automático.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadProviders}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
            title="Refrescar"
          >
            <FiRefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            id="btn-add-llm-provider"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <FiPlus size={16} /> Agregar Proveedor
          </button>
        </div>
      </div>

      {/* Providers list */}
      {providers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FiCpu size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No hay proveedores configurados.</p>
          <p className="text-gray-400 text-sm mt-1">
            Agrega Gemini o Groq para activar la generación de contenido con IA.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            + Agregar primer proveedor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((provider) => {
              const testResult = testResults[provider.id];
              return (
                <div
                  key={provider.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all ${provider.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <ProviderBadge providerKey={provider.provider_key} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{provider.display_name}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Prioridad {provider.priority}
                        </span>
                        {provider.is_active ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                            Activo
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                            Inactivo
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">
                          {provider.use_case}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="font-mono">{provider.model_name}</span>
                        {provider.base_url && (
                          <span className="ml-2 text-gray-300">· {provider.base_url}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5 font-mono">{provider.api_key_masked}</p>

                      {/* Test result badge */}
                      {testResult && (
                        <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${testResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {testResult.success ? (
                            <><FiCheckCircle size={12} /> {testResult.latency_ms}ms · {testResult.response_preview?.substring(0, 40)}...</>
                          ) : (
                            <><FiXCircle size={12} /> {testResult.error}</>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTest(provider)}
                      disabled={testingId === provider.id}
                      id={`btn-test-provider-${provider.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50"
                    >
                      {testingId === provider.id ? (
                        <FiLoader size={12} className="animate-spin" />
                      ) : (
                        <FiZap size={12} />
                      )}
                      Probar
                    </button>
                    <button
                      onClick={() => openEdit(provider)}
                      id={`btn-edit-provider-${provider.id}`}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(provider)}
                      id={`btn-delete-provider-${provider.id}`}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={editingProvider ? `Editar: ${editingProvider.display_name}` : 'Agregar Proveedor LLM'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Provider type */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Tipo de Proveedor</label>
            <select
              value={form.provider_key}
              onChange={e => handleProviderKeyChange(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none text-sm"
            >
              {PROVIDER_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Nombre para Mostrar *</label>
            <input
              type="text"
              required
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="Ej: Google Gemini Flash 2.0"
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium focus:outline-none text-sm"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
              API Key {editingProvider ? '(dejar vacío para conservar la actual)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                required={!editingProvider}
                value={form.api_key}
                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                placeholder={editingProvider ? editingProvider.api_key_masked : selectedType?.placeholder}
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-mono text-sm focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Model name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Modelo *</label>
            <input
              type="text"
              required
              value={form.model_name}
              onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
              placeholder="gemini-flash-latest / llama-3.3-70b-versatile / gpt-4o-mini"
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Base URL — only show if provider type requires it */}
          {selectedType?.baseUrlRequired && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Base URL *</label>
              <input
                type="url"
                required={selectedType.baseUrlRequired}
                value={form.base_url}
                onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
                placeholder="https://api.groq.com/openai/v1"
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-mono text-sm focus:outline-none"
              />
            </div>
          )}

          {/* Priority + Use case */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Prioridad</label>
              <input
                type="number"
                min={1}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Caso de Uso</label>
              <select
                value={form.use_case}
                onChange={e => setForm(f => ({ ...f, use_case: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-medium text-sm focus:outline-none"
              >
                {USE_CASE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Proveedor activo</label>
          </div>

          {/* Extra params (collapsible) */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
              Parámetros Extra (JSON opcional) — temperature, max_tokens, etc.
            </label>
            <textarea
              rows={3}
              value={extraParamsText}
              onChange={e => setExtraParamsText(e.target.value)}
              placeholder={'{\n  "temperature": 0.7,\n  "max_tokens": 2048\n}'}
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-3 font-mono text-xs focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : editingProvider ? 'Actualizar Proveedor' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        size="alert"
      >
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4">
            <FiTrash2 size={24} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">¿Eliminar proveedor?</h3>
          <p className="text-gray-500 text-sm mb-5">
            Vas a eliminar <strong>{deleteTarget?.display_name}</strong>. Si es el único proveedor activo, la IA dejará de funcionar.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

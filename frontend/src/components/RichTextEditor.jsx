import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  FiBold, FiItalic, FiUnderline,
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiAlignJustify,
  FiList
} from 'react-icons/fi';

/**
 * RichTextEditor
 * ─────────────
 * Editor WYSIWYG liviano construido sobre contentEditable.
 * Sin dependencias externas — usa document.execCommand (compatible con
 * todos los navegadores modernos incluyendo los WebViews de Capacitor).
 *
 * Props:
 *   value        {string}   HTML almacenado en el campo (puede tener \n, <b>, <br/>)
 *   onChange     {fn}       Callback (htmlString) => void
 *   placeholder  {string}   Texto de ayuda cuando está vacío
 *   minRows      {number}   Altura mínima visible (en líneas ~1.5rem/línea)
 *   primaryColor {string}   Color del tenant para los botones activos
 *   className    {string}   Clases extra para el wrapper externo
 *
 * Compatibilidad PDF:
 *   Los tags <b>, <i>, <u>, <br/> que produce este editor son
 *   reconocidos por safe_p() en el backend (ReportLab).
 *   Las alineaciones y listas producen HTML adicional que el preview
 *   del navegador mostrará correctamente; para el PDF se pasarán tal cual.
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Escribe aquí...',
  minRows = 4,
  primaryColor = '#4F46E5',
  className = '',
}) {
  const editorRef = useRef(null);
  const isFocused = useRef(false);

  // ── Sync value → DOM (solo cuando no está enfocado, para no mover el cursor) ──
  useEffect(() => {
    if (!isFocused.current && editorRef.current) {
      // Normaliza saltos de línea a <br/> antes de insertar en el DOM
      const newHTML = (value || '').replace(/(?<!\>)\n/g, '<br/>');
      if (editorRef.current.innerHTML !== newHTML) {
        editorRef.current.innerHTML = newHTML;
      }
    }
  }, [value]);

  // ── DOM → state ──
  const emitChange = useCallback(() => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput  = useCallback(emitChange, [emitChange]);
  const handleFocus  = useCallback(() => { isFocused.current = true; }, []);
  const handleBlur   = useCallback(() => { isFocused.current = false; emitChange(); }, [emitChange]);

  // ── Ejecuta un comando de formateo ──
  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  }, [emitChange]);

  // ── Estado activo de cada comando (para highlight del botón) ──
  // Forzamos re-render cuando cambia la selección del usuario
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onSel = () => setTick(t => t + 1);
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  const isActive = (cmd) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // ── Subcomponente: botón de la barra de herramientas ──
  const Btn = ({ cmd, icon, title, val = null }) => {
    const active = isActive(cmd);
    return (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
          active
            ? 'text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-white'
        }`}
        style={active ? { backgroundColor: primaryColor } : {}}
      >
        {icon}
      </button>
    );
  };

  const Sep = () => (
    <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1 flex-shrink-0" />
  );

  return (
    <div
      className={`border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden
        focus-within:ring-2 focus-within:border-transparent transition-all ${className}`}
      style={{ '--tw-ring-color': primaryColor }}
    >
      {/* ── Barra de herramientas ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600 flex-wrap">

        {/* Formato de texto */}
        <Btn cmd="bold"      icon={<FiBold size={13}/>}      title="Negrita  (Ctrl+B)" />
        <Btn cmd="italic"    icon={<FiItalic size={13}/>}    title="Cursiva  (Ctrl+I)" />
        <Btn cmd="underline" icon={<FiUnderline size={13}/>} title="Subrayado  (Ctrl+U)" />

        <Sep />

        {/* Alineación */}
        <Btn cmd="justifyLeft"   icon={<FiAlignLeft size={13}/>}    title="Alinear izquierda" />
        <Btn cmd="justifyCenter" icon={<FiAlignCenter size={13}/>}  title="Centrar" />
        <Btn cmd="justifyRight"  icon={<FiAlignRight size={13}/>}   title="Alinear derecha" />
        <Btn cmd="justifyFull"   icon={<FiAlignJustify size={13}/>} title="Justificar" />

        <Sep />

        {/* Listas */}
        <Btn cmd="insertUnorderedList" icon={<FiList size={13}/>} title="Lista con viñetas" />

        {/* Lista numerada — sin ícono Feather equivalente, usamos texto */}
        <button
          type="button"
          title="Lista numerada"
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-[10px] font-black leading-none
            ${isActive('insertOrderedList')
              ? 'text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}
          `}
          style={isActive('insertOrderedList') ? { backgroundColor: primaryColor } : {}}
        >
          1.
        </button>

        <Sep />

        {/* Limpiar formato */}
        <button
          type="button"
          title="Limpiar formato"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-all text-[10px] font-black leading-none text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          T×
        </button>
      </div>

      {/* ── Área editable ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        className="rte-body p-3 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 outline-none leading-relaxed overflow-y-auto"
        style={{ minHeight: `${minRows * 1.7}rem` }}
      />

      {/* ── Estilos del placeholder vía CSS puro ── */}
      <style>{`
        .rte-body:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          display: block;
        }
        .rte-body ul { list-style: disc;    padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-body ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
        .rte-body li { margin: 0.1rem 0; }
      `}</style>
    </div>
  );
}

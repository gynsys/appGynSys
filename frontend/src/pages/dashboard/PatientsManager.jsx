import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { useToastStore } from '../../store/toastStore';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiFileText, FiUser, FiCalendar, FiEdit, FiSearch, FiImage, FiDownload, FiEye } from 'react-icons/fi';
import { ConsultationAssetManager } from '../../components/common/ConsultationAssetManager';
import { openExternalFile, downloadFile, isCapacitor } from '../../utils/platform';

const HistoryHtmlView = ({ data, downloadUrl }) => {
  if (!data) return null;

  const isPlaceholder = (val) => 
    !val || 
    val.toLowerCase().includes('no registrado') || 
    val.toLowerCase().includes('no realizado') ||
    val.toLowerCase().includes('sin registro');

  const consultations = data.is_single_report
    ? [{
      created_at: data.created_at,
      diagnosis: data.diagnosis,
      plan: data.plan,
      physical_exam: data.physical_exam,
      ultrasound: data.ultrasound,
      observations: data.observations
    }]
    : (data.all_consultations || []);

  // --- Vista simplificada para Informe Individual ---
  if (data.is_single_report) {
    const c = consultations[0] || {};
    return (
      <div className="space-y-3 text-gray-800 dark:text-gray-200 p-1">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-indigo-600 font-bold text-sm">
              {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              Informe
            </span>
          </div>
          {/* medical_report_content tiene prioridad si existe */}
          {data.medical_report_content ? (
            <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
              {data.medical_report_content}
            </p>
          ) : (
            <div className="space-y-3">
              {!isPlaceholder(c.diagnosis) && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Diagnóstico</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.diagnosis}</p>
                </div>
              )}
              {!isPlaceholder(c.plan) && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan de Tratamiento</p>
                  <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{c.plan}</p>
                </div>
              )}
              {(!isPlaceholder(c.physical_exam) || !isPlaceholder(c.ultrasound)) && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {!isPlaceholder(c.physical_exam) && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Examen Físico</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{c.physical_exam}</p>
                    </div>
                  )}
                  {!isPlaceholder(c.ultrasound) && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Ecografía</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{c.ultrasound}</p>
                    </div>
                  )}
                </div>
              )}
              {!isPlaceholder(c.observations) && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Observaciones</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.observations}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Vista completa para Historia Clínica ---
  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200 p-1 md:p-4 overflow-y-auto max-h-[70vh]">
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {data.is_single_report ? 'Informe Médico' : 'Información del Paciente'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Nombre Completo</p>
            <p className="font-semibold text-right">{data.full_name}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Identificación (CI)</p>
            <p className="font-semibold text-right">{data.ci}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Edad</p>
            <p className="font-semibold text-right">{data.age} años</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Teléfono</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-right">{data.phone}</p>
              {data.phone && data.phone !== 'N/A' && (
                <a
                  href={`https://wa.me/${data.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir WhatsApp"
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Dirección</p>
            <p className="font-semibold text-right">{data.address || ' '}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Ocupación</p>
            <p className="font-semibold text-right">{data.occupation || ' '}</p>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-gray-500">Correo</p>
            <p className="font-semibold text-right truncate max-w-[60%]">{data.email || '-'}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500">N° Historia</p>
            <p className="font-semibold text-right text-indigo-600">{data.history_number}</p>
          </div>
        </div>
      </div>

      {(data.reason_for_visit) && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold border-b pb-2">Motivo de consulta</h4>
          <p className="text-sm italic">{data.reason_for_visit}</p>
        </div>
      )}

      {(data.summary_gyn_obstetric || data.personal_history || data.family_history_mother || data.family_history_father || data.summary_functional_exam || data.surgical_history || !data.is_single_report) && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold border-b pb-2">Antecedentes y Perfil</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(data.family_history_mother || data.family_history_father) && (
              <div className="space-y-2 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Antecedentes Familiares</p>
                {data.family_history_mother && <p className="text-sm italic"><strong>Madre:</strong> {data.family_history_mother}</p>}
                {data.family_history_father && <p className="text-sm italic"><strong>Padre:</strong> {data.family_history_father}</p>}
              </div>
            )}
            {data.personal_history && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Antecedentes Personales:</p>
                <p className="text-sm italic inline">{data.personal_history}</p>
              </div>
            )}
            {data.supplements && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Suplementos:</p>
                <p className="text-sm italic inline">{data.supplements}</p>
              </div>
            )}
            {data.surgical_history && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Antecedentes Quirúrgicos:</p>
                <p className="text-sm italic inline">{data.surgical_history}</p>
              </div>
            )}
            {data.summary_gyn_obstetric && (
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Gineco-Obstétricos:</p>
                <p className="text-sm italic inline">{data.summary_gyn_obstetric}</p>
              </div>
            )}
            {data.summary_functional_exam && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Examen Funcional:</p>
                <p className="text-sm italic inline">{data.summary_functional_exam}</p>
              </div>
            )}
            {data.summary_habits && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider inline mr-2">Resumen Hábitos:</p>
                <p className="text-sm italic inline">{data.summary_habits}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4">
        <h4 className="text-lg font-bold border-b pb-2">
          {data.is_single_report ? 'Detalles de la Consulta' : 'Evolución Médica (Consultas)'}
        </h4>
        <div className={`space-y-8 relative ${!data.is_single_report ? "before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700" : ""}`}>
          {consultations.map((c, idx) => {
            const hasData = 
              !isPlaceholder(c.diagnosis) || 
              !isPlaceholder(c.plan) || 
              !isPlaceholder(c.physical_exam) || 
              !isPlaceholder(c.ultrasound) || 
              !isPlaceholder(c.observations);

            if (!hasData) return null;

            return (
              <div key={idx} className={`relative ${!data.is_single_report ? "pl-10" : ""}`}>
              {!data.is_single_report && (
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 z-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-indigo-600 font-bold">{new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                    {data.is_single_report ? 'Reporte Actual' : 'Consulta'}
                  </span>
                </div>

                <div className="space-y-4">
                  {!isPlaceholder(c.diagnosis) && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Diagnóstico</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.diagnosis}</p>
                    </div>
                  )}
                  {!isPlaceholder(c.plan) && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Plan de Tratamiento</p>
                      <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{c.plan}</p>
                    </div>
                  )}
                  {(!isPlaceholder(c.physical_exam) || !isPlaceholder(c.ultrasound)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50 dark:border-gray-700">
                      {!isPlaceholder(c.physical_exam) && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Examen Físico</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{c.physical_exam}</p>
                        </div>
                      )}
                      {!isPlaceholder(c.ultrasound) && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Ecografía</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{c.ultrasound}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!isPlaceholder(c.observations) && (
                    <div className="pt-2 border-t border-gray-50 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-400 uppercase">Observaciones</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{c.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Adjuntos / Soportes */}
      {data.id && (
          <ConsultationAssetManager consultationId={data.id} readOnly={false} />
      )}

    </div>
  );
};

export default function PatientsManager({ isEmbedded = false }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const { doctor, isDarkTheme } = useOutletContext() || {};
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [internalDeleteModalOpen, setInternalDeleteModalOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(true);

  // PDF Preview State
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activePdfTab, setActivePdfTab] = useState('pdf'); // 'pdf' or 'assets'
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [basePdfUrl, setBasePdfUrl] = useState(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [includeColor, setIncludeColor] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [isAssetOnly, setIsAssetOnly] = useState(false);
  const [currentPatientName, setCurrentPatientName] = useState('');
  const [customReportDate, setCustomReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [consultationToEdit, setConsultationToEdit] = useState(null);
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'history' or 'report'
  const [editFormData, setEditFormData] = useState({});
  const [patientReports, setPatientReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  // Consultas sucesivas del paciente para el modo edición de informe
  const [editReportConsultations, setEditReportConsultations] = useState([]);
  const [editReportLoadingId, setEditReportLoadingId] = useState(null);

  const { showToast } = useToastStore();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultations/');
      const data = response.data;
      const grouped = {};
      data.forEach(consultation => {
        const ci = consultation.patient_ci;
        if (!grouped[ci] || new Date(consultation.created_at) > new Date(grouped[ci].created_at)) {
          grouped[ci] = consultation;
        }
      });
      setConsultations(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlanWithBullets = (planText) => {
    if (!planText) return '';
    return planText.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('•')) {
        return '• ' + trimmed;
      }
      return trimmed;
    }).join('\n');
  };

  const handleEditClick = async (consultation) => {
    setConsultationToEdit(consultation);

    // Fetch datos completos desde el backend para garantizar que todos los
    // campos de historia (antecedentes, resúmenes, etc.) estén presentes.
    // El endpoint /data usa _map_consultation_to_data que mapea correctamente
    // todos los campos de la DB al schema del formulario.
    let fullData = consultation;
    try {
      const res = await api.get(`/consultations/${consultation.id}/data`);
      fullData = { ...consultation, ...res.data };
    } catch (e) {
      // Si falla el fetch, usamos los datos parciales de la lista como fallback
      console.error('[EditClick] Error fetching full consultation data:', e);
    }

    setEditFormData({
      full_name: fullData.full_name || fullData.patient_name || '',
      ci: fullData.ci || fullData.patient_ci || '',
      age: fullData.age || fullData.patient_age || '',
      phone: fullData.phone || fullData.patient_phone || '',
      address: fullData.address || '',
      occupation: fullData.occupation || '',
      reason_for_visit: fullData.reason_for_visit || '',
      family_history_mother: fullData.family_history_mother || '',
      family_history_father: fullData.family_history_father || '',
      personal_history: fullData.personal_history || '',
      supplements: fullData.supplements || '',
      surgical_history: fullData.surgical_history || '',
      summary_gyn_obstetric: fullData.summary_gyn_obstetric || '',
      summary_functional_exam: fullData.summary_functional_exam || '',
      summary_habits: fullData.summary_habits || '',
      admin_physical_exam: fullData.admin_physical_exam || fullData.physical_exam || '',
      admin_ultrasound: fullData.admin_ultrasound || fullData.ultrasound || '',
      admin_diagnosis: formatPlanWithBullets(fullData.admin_diagnosis || fullData.diagnosis || ''),
      admin_plan: formatPlanWithBullets(fullData.admin_plan || fullData.plan || ''),
      admin_observations: fullData.admin_observations || fullData.observations || '',
      medical_report_content: fullData.medical_report_content || '',
      history_number: fullData.history_number || '',
    });

    setChoiceModalOpen(true);
  };

  const handleChoice = async (mode) => {
    setEditMode(mode);
    setChoiceModalOpen(false);
    setEditModalOpen(true);

    // Para el modo informe, cargar todas las consultas del paciente para permitir edición sucesiva
    if (mode === 'report' && consultationToEdit?.patient_ci) {
      try {
        const res = await api.get(`/consultations/patient/${consultationToEdit.patient_ci}/raw`);
        setEditReportConsultations(res.data || []);
      } catch (e) {
        setEditReportConsultations([]);
      }
    }
  };

  // Carga los datos de una consulta específica en el formulario de informe (para consultas sucesivas)
  const loadReportConsultation = async (reportConsultation) => {
    setEditReportLoadingId(reportConsultation.id);
    try {
      const res = await api.get(`/consultations/${reportConsultation.id}/data`);
      const fullData = { ...reportConsultation, ...res.data };
      setConsultationToEdit(reportConsultation);
      setEditFormData(prev => ({
        ...prev,
        admin_diagnosis: formatPlanWithBullets(fullData.admin_diagnosis || fullData.diagnosis || ''),
        admin_plan: formatPlanWithBullets(fullData.admin_plan || fullData.plan || ''),
        admin_physical_exam: fullData.admin_physical_exam || fullData.physical_exam || '',
        admin_ultrasound: fullData.admin_ultrasound || fullData.ultrasound || '',
        admin_observations: fullData.admin_observations || fullData.observations || '',
        medical_report_content: fullData.medical_report_content || '',
      }));
    } catch (e) {
      console.error('[loadReportConsultation] Error:', e);
    } finally {
      setEditReportLoadingId(null);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const addBullet = (fieldName) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || '') + '\n• '
    }));
  };

  const handleUpdate = async (e, isClone = false) => {
    if (e) e.preventDefault();
    if (!consultationToEdit) return;
    
    try {
      const endpoint = isClone 
        ? `/consultations/${consultationToEdit.id}/clone`
        : `/consultations/${consultationToEdit.id}`;
      
      const method = isClone ? 'post' : 'put';
      
      console.log(`[DEBUG] handleUpdate - isClone: ${isClone}, endpoint: ${endpoint}, method: ${method}`);
      
      await api[method](endpoint, editFormData);
      
      showToast(
        isClone ? 'Informe clonado exitosamente' : 'Cambios guardados exitosamente', 
        'success'
      );
      
      fetchConsultations();
      setEditModalOpen(false);
      setEditMode(null);
    } catch (error) {
      showToast('Error al procesar la solicitud', 'error');
    }
  };

  const handleDeleteClick = (id, all = true) => {
    setConsultationToDelete(id);
    setIsDeletingAll(all);
    if (all) {
      setDeleteModalOpen(true);
    } else {
      setInternalDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!consultationToDelete) return;
    
    // Find the CI of the patient we are deleting to clean up local state
    const target = consultations.find(c => c.id === consultationToDelete);
    const targetCi = target?.patient_ci;

    try {
      // Use delete_all query param based on isDeletingAll
      await api.delete(`/consultations/${consultationToDelete}${isDeletingAll ? '?delete_all=true' : ''}`);
      showToast(isDeletingAll ? 'Historia clínica eliminada exitosamente' : 'Consulta eliminada exitosamente', 'success');
      
      if (isDeletingAll) {
        if (targetCi) {
          setConsultations(prev => prev.filter(c => c.patient_ci !== targetCi));
        } else {
          setConsultations(prev => prev.filter(c => c.id !== consultationToDelete));
        }
        setPdfModalOpen(false); // Close if the whole history was deleted
      } else {
        // Individual delete: manually update local lists to avoid stale state issues
        setPatientReports(prev => {
          const updated = prev.filter(r => String(r.id) !== String(consultationToDelete));
          
          // If the deleted one was being viewed, switch to another one
          if (String(consultationToDelete) === String(currentConsultationId)) {
            if (updated.length > 0) {
              const next = updated[0];
              setCurrentConsultationId(next.id);
              const suffix = basePdfUrl.includes('history_pdf') ? 'history_pdf' : 'pdf';
              setBasePdfUrl(`${API_BASE}/consultations/${next.id}/${suffix}`);
            } else {
              setPdfModalOpen(false);
            }
          }
          return updated;
        });

        if (targetCi) fetchPatientReports(targetCi); // Sync with server backup
        fetchConsultations(); 
      }
    } catch (error) {
      showToast('Error al eliminar la historia', 'error');
    } finally {
      setDeleteModalOpen(false);
      setInternalDeleteModalOpen(false);
      setConsultationToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchPatientReports = async (dni) => {
    if (!dni) return;
    try {
      setLoadingReports(true);
      const response = await api.get(`/consultations/patient/${dni}/raw`);
      setPatientReports(response.data);
    } catch (error) {
      console.error('Error fetching patient reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleViewPdf = (url, name) => {
    setIsAssetOnly(false); // Reset to PDF mode
    setBasePdfUrl(url);
    setCurrentPatientName(name || ''); 
    setHistoryData(null);
    setActivePdfTab('pdf'); // Modal siempre abre en PDF por defecto
    
    // Extraer ID inmediatamente para evitar ruidos en AssetManager
    const match = url.match(/\/consultations\/(\d+)\//);
    if (match) {
      const consultationId = match[1];
      setCurrentConsultationId(consultationId);
      
      // Buscar el CI del paciente para esta consulta para cargar todos sus reportes
      const consultation = consultations.find(c => String(c.id) === String(consultationId));
      if (consultation && consultation.patient_ci) {
        fetchPatientReports(consultation.patient_ci);
      }
    }
    
    setPdfModalOpen(true);
  };

  const handleViewAssets = (consultationId, patientName) => {
    setIsAssetOnly(true);
    setBasePdfUrl(null);
    setCurrentConsultationId(consultationId);
    setCurrentPatientName(patientName || '');
    setActivePdfTab('assets');
    setHistoryData(null);
    setPdfModalOpen(true);
  };

  // Helper function to get the actual PDF URL with current parameters
  const getFullPdfUrl = (isDownload = false) => {
    if (!basePdfUrl) return null;
    let url = basePdfUrl;
    const params = new URLSearchParams();
    if (includeImages) params.append('include_images', 'true');
    if (includeColor) params.append('use_color', 'true');
    if (!includeWatermark) params.append('include_watermark', 'false');
    if (customReportDate) params.append('report_at', customReportDate);
    if (isDownload) params.append('download', 'true');
    
    const queryString = params.toString();
    return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
  };

  // Effect to fetch history data when modal opens or basePdfUrl/activePdfTab changes
  useEffect(() => {
    const fetchHistoryData = async () => {
      // 1. Si el modal no está abierto, no hacemos nada
      if (!isPdfModalOpen) return;

      // 2. Si es pestaña de activos, solo nos aseguramos de tener el ID si es posible
      if (activePdfTab === 'assets') {
        setHistoryData(null);
        if (!currentConsultationId && basePdfUrl) {
           const match = basePdfUrl.match(/\/consultations\/(\d+)\//);
           if (match) setCurrentConsultationId(match[1]);
        }
        return;
      }

      // 3. Si no hay URL base y no estamos en modo solo activos, paramos
      if (!basePdfUrl) return;

      const isHistory = basePdfUrl.includes('history_pdf');
      const isReport = basePdfUrl.includes('/pdf') && !basePdfUrl.includes('history');

      if (isHistory || isReport) {
        const match = basePdfUrl.match(/\/consultations\/(\d+)\//);
        const consultationId = match ? match[1] : null;
        
        if (consultationId) {
          // Si ya tenemos el ID y los datos de ESE ID, no recargamos
          if (historyData?.id === parseInt(consultationId) && !loadingHistory) {
              return;
          }

          setCurrentConsultationId(consultationId);
          setLoadingHistory(true);
          try {
            const dataEndpoint = isHistory ? 'history_data' : 'data';
            const response = await api.get(`/consultations/${consultationId}/${dataEndpoint}`);
            setHistoryData(response.data);
          } catch (error) {
            console.error("Error fetching native data:", error);
            setHistoryData(null);
          } finally {
            setLoadingHistory(false);
          }
        }
      }
    };

    fetchHistoryData();
  }, [isPdfModalOpen, basePdfUrl, activePdfTab]);


  const filteredConsultations = consultations.filter(consultation =>
    consultation.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.patient_ci?.includes(searchTerm)
  );

  return (
    <div className={isEmbedded ? "py-4" : "max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8"}>
      {!isEmbedded && (
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left px-4 sm:px-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Gestión de Historias Médicas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Administra las consultas y reportes generados.</p>
          </div>
          <div className="relative w-full md:w-80 px-4 sm:px-0">
            <div className="absolute inset-y-0 left-0 pl-8 md:pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o CI..."
              className={`block w-full pl-12 pr-4 py-3 border-2 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent md:text-sm text-gray-900 dark:text-white transition-all shadow-sm ${
                isFocused ? '' : 'border-gray-100 dark:border-gray-700'
              }`}
              style={{ 
                borderColor: isFocused ? (doctor?.theme_primary_color || '#4f46e5') : undefined,
                boxShadow: isFocused ? `0 0 0 2px ${(doctor?.theme_primary_color || '#4f46e5')}44` : undefined
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-[32px] shadow-sm p-12 md:p-20 text-center border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700">
          <FiUser className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-700 mb-6" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white">
            {searchTerm ? 'No se encontraron resultados' : 'No hay historias registradas'}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
            Las consultas guardadas aparecerán de forma organizada aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card View for Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-2">
            {filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="bg-white dark:bg-gray-800 rounded-none sm:rounded-[24px] border-y border-x-0 sm:border-x border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl">
                      <FiUser />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{consultation.patient_name || 'Desconocido'}</h4>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">CI: {consultation.patient_ci || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    #{consultation.history_number || 'PEND'}
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button 
                    onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`, consultation.patient_name)}
                    className="flex-1 inline-flex justify-center items-center px-1 py-2.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white shadow-sm"
                    title="Ver Informe Médico"
                  >
                    INFORME
                  </button>
                  <button 
                    onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`, consultation.patient_name)}
                    className="flex-1 inline-flex justify-center items-center px-1 py-2.5 rounded-lg text-[10px] font-black bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    title="Ver Historia Completa"
                  >
                    HISTORIA
                  </button>
                  <button 
                    onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                    className="ml-[10px] p-0.5 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center border border-gray-100"
                    title="Ver Soportes Digitales"
                  >
                    <FiImage size={18} />
                  </button>
                  <button onClick={() => handleEditClick(consultation)} className="ml-2 p-0.5 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <FiEdit size={18} />
                  </button>
                  <button onClick={() => handleDeleteClick(consultation.id)} className="ml-2 p-0.5 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table View for Desktop */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Paciente</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">N° Historia</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Fecha</th>
                  <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center text-indigo-600"><FiUser /></div>
                        <div className="ml-4 font-bold text-sm">{consultation.patient_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{consultation.history_number}</td>
                    <td className="px-6 py-4 text-xs font-bold">{formatDate(consultation.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/pdf`, consultation.patient_name)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black shadow-sm hover:bg-indigo-700 transition-all"
                          title="Ver Informe Médico"
                        >
                          <FiEye size={14} /> INFORME
                        </button>
                        <button 
                          onClick={() => handleViewPdf(`${API_BASE}/consultations/${consultation.id}/history_pdf`, consultation.patient_name)}
                          className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-black hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                          title="Ver Historia Clínica"
                        >
                          HISTORIA
                        </button>
                         <button 
                          onClick={() => handleViewAssets(consultation.id, consultation.patient_name)} 
                          className="p-2 text-gray-400 rounded-xl hover:bg-gray-50 transition-colors"
                          title="Ver Soportes Digitales"
                        >
                          <FiImage size={18} />
                        </button>
                        <button onClick={() => handleEditClick(consultation)} className="p-2 text-indigo-500 rounded-xl hover:bg-indigo-50"><FiEdit size={18} /></button>
                        <button onClick={() => handleDeleteClick(consultation.id)} className="p-2 text-red-400 rounded-xl hover:bg-red-50"><FiTrash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isPdfModalOpen} 
        onClose={() => { 
          setPdfModalOpen(false); 
          setHistoryData(null); 
          setActivePdfTab('pdf'); 
          setIsAssetOnly(false);
          setCurrentPatientName('');
        }} 
        title={isAssetOnly ? `Soportes Digitales de ${currentPatientName}` : `Vista Previa - ${currentPatientName}`} 
        size="4xl" 
        fullScreenOnMobile
      >
        <div className="flex flex-col h-full">
          {/* Explorador de Informes / Consultas */}
          {patientReports.length > 1 && !isAssetOnly && !basePdfUrl?.includes('history_pdf') && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Línea del tiempo / Seleccionar Consulta</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                {patientReports.map((report) => {
                  const isSelected = String(report.id) === String(currentConsultationId);
                  return (
                    <div 
                      key={report.id} 
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-2 ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setCurrentConsultationId(report.id);
                          const suffix = basePdfUrl.includes('history_pdf') ? 'history_pdf' : 'pdf';
                          setBasePdfUrl(`${API_BASE}/consultations/${report.id}/${suffix}`);
                          setHistoryData(null); // Force reload
                        }}
                        className="text-[11px] font-black whitespace-nowrap"
                      >
                        Informe {new Date(report.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(report.id, false);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected ? 'text-white/80 hover:bg-white/20' : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Eliminar esta copia"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs Navigation - Ocultas en modo solo activos */}
          {currentConsultationId && !isAssetOnly && (
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4 pb-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setActivePdfTab('pdf')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activePdfTab === 'pdf' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {basePdfUrl?.includes('history_pdf') ? 'HISTORIA' : 'INFORME'}
                </button>
                <button
                  onClick={() => setActivePdfTab('assets')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activePdfTab === 'assets' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  SOPORTES
                </button>

                {!basePdfUrl?.includes('history_pdf') && (
                  <>
                    <div className="flex flex-col gap-1 border-r pr-4 border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-tighter">Fecha Reporte</span>
                      <input
                        type="date"
                        value={customReportDate}
                        onChange={(e) => setCustomReportDate(e.target.value)}
                        className="text-xs font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-600 dark:text-gray-100 dark:[color-scheme:dark] w-24"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer border-r pr-4 border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={includeWatermark}
                        onChange={(e) => setIncludeWatermark(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Marca de Agua</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border-r pr-4 border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={includeColor}
                        onChange={(e) => setIncludeColor(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">PDF a color</span>
                    </label>
                  </>
                )}

                <label className="flex items-center gap-2 cursor-pointer sm:ml-auto">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Incluir imágenes en el PDF</span>
                </label>
              </div>
            </div>
          )}

          <div className={`flex-1 overflow-auto min-h-[50vh] md:min-h-0 ${activePdfTab === 'assets' ? 'p-4' : ''}`}>
            {activePdfTab === 'pdf' ? (
              <>
                {loadingHistory ? (
                  <div className="md:hidden flex flex-col items-center justify-center p-20 animat-pulse text-gray-500">Cargando documento...</div>
                ) : historyData ? (
                  <div className="md:hidden"><HistoryHtmlView data={historyData} downloadUrl={getFullPdfUrl()} /></div>
                ) : null}
                 <div className="hidden md:block h-[60vh] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                  {basePdfUrl && <iframe src={getFullPdfUrl()} className="w-full h-full border-0" title="Visor de PDF" />}
                </div>
                {/* Mobile specific PDF helper for native apps */}
                {isCapacitor() && (
                  <div className="md:hidden flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                    <FiFileText className="w-12 h-12 text-indigo-500 mb-4" />
                    <p className="text-sm text-center font-medium mb-6">Para una mejor experiencia y compatibilidad, abre el documento en el visor nativo del sistema.</p>
                     <button 
                      onClick={() => openExternalFile(getFullPdfUrl())}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      ABRIR DOCUMENTO
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Tab Content: Assets
              <div className="h-[60vh] overflow-y-auto pr-2">
                <ConsultationAssetManager consultationId={currentConsultationId} readOnly={false} />
              </div>
            )}
          </div>
          <div className="mt-6 flex-shrink-0 flex justify-between items-center px-2 pb-6">
             {basePdfUrl && !isAssetOnly && (
              <button 
                onClick={() => isCapacitor() ? openExternalFile(getFullPdfUrl(true)) : downloadFile(getFullPdfUrl(true))} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
              >
                {isCapacitor() ? 'Abrir Externo' : 'Descargar PDF'}
              </button>
            )}
          </div>
        </div>

        {/* Modal de Confirmación Interno para evitar cierre del padre */}
        <Modal 
          isOpen={internalDeleteModalOpen} 
          onClose={() => setInternalDeleteModalOpen(false)} 
          title="Confirmar"
          size="sm"
        >
          <div className="p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-6">¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setInternalDeleteModalOpen(false)} 
                className="px-6 py-2 border-2 border-gray-100 dark:border-gray-700 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                No, cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-600 transition-all"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      </Modal>

      <Modal 
        isOpen={choiceModalOpen} 
        onClose={() => setChoiceModalOpen(false)} 
        title="¿Qué deseas editar?" 
        size="md"
        fullScreenOnMobile
      >
        <div className="h-full flex flex-col justify-center gap-10 p-4">
          <button 
            onClick={() => handleChoice('history')}
            className="flex items-center gap-4 p-6 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-3xl transition-all group text-left border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
          >
            <div className="h-[35px] w-[35px] flex-shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <FiUser size={18} />
            </div>
            <div>
              <h4 className="font-black text-indigo-900 dark:text-indigo-100 text-lg uppercase tracking-tight">Historia Clínica</h4>
              <p className="text-sm font-medium text-indigo-600/70 dark:text-indigo-400/70">Identificación, antecedentes y perfil permanente.</p>
            </div>
          </button>

          <button 
            onClick={() => handleChoice('report')}
            className="flex items-center gap-4 p-6 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-3xl transition-all group text-left border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-800"
          >
            <div className="h-[35px] w-[35px] flex-shrink-0 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <FiFileText size={18} />
            </div>
            <div>
              <h4 className="font-black text-teal-900 dark:text-teal-100 text-lg uppercase tracking-tight">Informe Médico</h4>
              <p className="text-sm font-medium text-teal-600/70 dark:text-teal-400/70">Hallazgos actuales, diagnóstico y plan de tratamiento.</p>
            </div>
          </button>
        </div>
      </Modal>

      {/* Edit Modal Refactored - Full Version */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => { setEditModalOpen(false); setEditMode(null); }} 
        title={editMode === 'history' ? "Editar Historia Clínica" : "Editar Informe Médico"} 
        size="story"
        fullScreenOnMobile
      >
        <form onSubmit={handleUpdate} className="flex flex-col h-full max-h-[85vh]">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-indigo-200">
            
            {/* Sección: Datos de Identificación (Siempre visible en Historia, solo lectura o simplificada en Informe si se desea, pero la dejaremos para Historia) */}
            {editMode === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Identificación del Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nombre Completo</label>
                  <input name="full_name" value={editFormData.full_name || ''} onChange={handleEditChange} placeholder="Nombre completo" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cédula / ID</label>
                  <input name="ci" value={editFormData.ci || ''} onChange={handleEditChange} placeholder="CI" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Número de Historia</label>
                  <input name="history_number" value={editFormData.history_number || ''} onChange={handleEditChange} placeholder="N° Historia" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Edad</label>
                  <input name="age" value={editFormData.age || ''} onChange={handleEditChange} placeholder="Edad" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Teléfono</label>
                  <input name="phone" value={editFormData.phone || ''} onChange={handleEditChange} placeholder="Teléfono" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ocupación</label>
                  <input name="occupation" value={editFormData.occupation || ''} onChange={handleEditChange} placeholder="Ocupación" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dirección</label>
                  <input name="address" value={editFormData.address || ''} onChange={handleEditChange} placeholder="Dirección de habitación" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
              </div>
            </div>
            )}

            {editMode === 'history' && (
            <>
            <hr className="border-gray-100" />

            {/* Sección: Antecedentes */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Antecedentes Médicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Motivo de Consulta</label>
                  <textarea name="reason_for_visit" value={editFormData.reason_for_visit || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Madre)</label>
                  <textarea name="family_history_mother" value={editFormData.family_history_mother || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Familiares (Padre)</label>
                  <textarea name="family_history_father" value={editFormData.family_history_father || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Personales</label>
                  <textarea name="personal_history" value={editFormData.personal_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Antecedentes Quirúrgicos</label>
                  <textarea name="surgical_history" value={editFormData.surgical_history || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Suplementos / Medicamentos</label>
                  <textarea name="supplements" value={editFormData.supplements || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-teal-50/30 dark:bg-teal-900/10 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Sección: Resúmenes de Sistemas */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                Resúmenes de Sistemas
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen Gineco-Obstétrico</label>
                  <textarea name="summary_gyn_obstetric" value={editFormData.summary_gyn_obstetric || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-pink-50/30 dark:bg-pink-900/10 border-2 border-transparent focus:border-pink-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen Examen Funcional</label>
                  <textarea name="summary_functional_exam" value={editFormData.summary_functional_exam || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resumen de Hábitos</label>
                  <textarea name="summary_habits" value={editFormData.summary_habits || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
              </div>
            </div>
            <hr className="border-gray-100" />

            {/* Sección: Hallazgos de la Consulta */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Hallazgos de la Consulta
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Diagnóstico</label>
                  <textarea name="admin_diagnosis" value={editFormData.admin_diagnosis || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Examen Físico</label>
                    <textarea name="admin_physical_exam" value={editFormData.admin_physical_exam || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ecografía</label>
                    <textarea name="admin_ultrasound" value={editFormData.admin_ultrasound || ''} onChange={handleEditChange} rows="3" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Plan de Tratamiento</label>
                  <textarea name="admin_plan" value={editFormData.admin_plan || ''} onChange={handleEditChange} rows="4" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Observaciones</label>
                  <textarea name="admin_observations" value={editFormData.admin_observations || ''} onChange={handleEditChange} rows="2" className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none font-medium dark:text-gray-100" />
                </div>
              </div>
            </div>
            <hr className="border-gray-100" />
            </>
            )}

            {/* Sección: Hallazgos Médicos (Visible en Informe) */}
            {editMode === 'report' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Editar Informe Médico
              </h3>

              {/* Selector de consultas sucesivas */}
              {editReportConsultations.length > 1 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seleccionar consulta a editar</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200">
                    {editReportConsultations.map((rc) => {
                      const isSelected = String(rc.id) === String(consultationToEdit?.id);
                      const isLoading = editReportLoadingId === rc.id;
                      return (
                        <button
                          key={rc.id}
                          type="button"
                          onClick={() => !isSelected && loadReportConsultation(rc)}
                          disabled={isLoading}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black border-2 transition-all whitespace-nowrap ${
                            isSelected
                              ? 'bg-green-600 border-green-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300 hover:text-green-600'
                          }`}
                        >
                          {isLoading ? '...' : new Date(rc.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 font-black">Contenido del Informe Médico (Unificado)</label>
                   <textarea 
                    name="medical_report_content" 
                    value={editFormData.medical_report_content || ''} 
                    onChange={handleEditChange} 
                    rows="15" 
                    className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500 rounded-2xl text-sm transition-all outline-none font-medium dark:text-gray-100 shadow-inner"
                    placeholder="Escribe el informe aquí..."
                  />
                </div>
              </div>
            </div>
            )}

          </div>

          {/* Footer del Modal */}
          <div className="flex-shrink-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => { setEditModalOpen(false); setEditMode(null); }} 
              className="px-6 py-3 border-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancelar
            </button>
            
            {editMode === 'report' && (
              <button 
                type="button"
                onClick={(e) => handleUpdate(e, true)}
                className="px-6 py-3 bg-teal-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-teal-200 dark:shadow-none hover:bg-teal-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <FiDownload size={16} />
                Guardar como
              </button>
            )}

            <button 
              type="submit" 
              className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>


      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmar" size="alert">
        <div className="p-2 text-center h-full flex flex-col justify-center">
          <p className="text-gray-900 dark:text-white font-black text-lg tracking-tight">¿Seguro de eliminar?</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => setDeleteModalOpen(false)} className="px-5 py-1.5 border-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">No</button>
            <button onClick={confirmDelete} className="px-5 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-700 transition-all">Sí, eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

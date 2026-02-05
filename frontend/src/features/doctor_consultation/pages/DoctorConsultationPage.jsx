import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FaUserCircle,
  FaNotesMedical,
  FaBaby,
  FaStethoscope,
  FaRunning,
  FaPills,
  FaCommentMedical,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaHistory
} from 'react-icons/fa';
import { authService } from '../../../services/authService';
import { appointmentService } from '../../../services/appointmentService';
import { usePreconsultaEngine } from '../../preconsulta/hooks/usePreconsultaEngine';
import physicalExamFlow from '../data/physical_exam_flow.json';
import { doctorExamTexts } from '../data/texts';
import { ButtonSelection } from '../../preconsulta/components/inputs/ButtonSelection';
import { YesNoInput } from '../../preconsulta/components/inputs/YesNoInput';
import { ChecklistInput } from '../../preconsulta/components/inputs/ChecklistInput';
import { NumericInput } from '../../preconsulta/components/inputs/NumericInput';
import { TextInput } from '../../preconsulta/components/inputs/TextInput';
import { fieldLabels } from '../../preconsulta/data/texts';
import { PRECONSULTA_OPTIONS } from '../../preconsulta/data/options';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { ListBuilder } from '../../../components/common/ListBuilder';
import { formatFullGynObstetricSummary, formatPhysicalExamSummary } from '../../../utils/medicalFormatters';
import { generateHabitsSummary, generateFunctionalExamSummary } from '../../../utils/consultationSummaries';
import { consultationService } from '../../../services/consultationService';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { useToastStore } from '../../../store/toastStore';
import { useDarkMode } from '../../../hooks/useDarkMode';

export const DoctorConsultationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [darkMode] = useDarkMode();
  const appointmentId = searchParams.get('appointment_id');
  const [activeSection, setActiveSection] = useState('physical_exam');
  const [examMode, setExamMode] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [pdfSettings, setPdfSettings] = useState({});
  const [doctor, setDoctor] = useState(null);
  const [allPreviousConsultations, setAllPreviousConsultations] = useState([]);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const user = await authService.getCurrentUser();
        setDoctor(user);
      } catch (error) {
        console.error("Error fetching doctor info", error);
      }
    };
    fetchDoctor();
  }, []);

  const primaryColor = doctor?.theme_primary_color || '#000';

  // Additional Doctor Fields
  const [manualExamText, setManualExamText] = useState('');
  const [ultrasound, setUltrasound] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');
  const [observations, setObservations] = useState('');

  // List view state
  const [appointments, setAppointments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isNewConsultationModalOpen, setIsNewConsultationModalOpen] = useState(false);
  const { success, error: toastError } = useToastStore();

  // Load appointments list if no ID selected
  useEffect(() => {
    if (!appointmentId) {
      const fetchAppointments = async () => {
        setLoadingList(true);
        try {
          const data = await appointmentService.getAppointments();
          // Filter for appointments that have preconsulta answers OR are confirmed/ready to see
          const withPreconsulta = data.filter(app => {
            const status = app.status?.toLowerCase() || '';
            const hasAnswers = !!app.preconsulta_answers;

            // Show if:
            // 1. Has preconsulta answers (Standard Flow)
            // 2. OR is 'confirmed' (Recurrent Flow - no answers needed)
            // 3. OR is 'preconsulta_completed'
            // AND is NOT finished/completed (Historical)

            const isActive = status !== 'completed' && status !== 'finished' && status !== 'cancelled' && status !== 'rejected';

            // Logic to prevent "Zombie" appointments (Old confirmed tests)
            // For Recurrent Patients (confirmed): Only show if >= Yesterday (Recent/Future)
            // For New Patients (preconsulta_completed): Show Always (Action needed)

            let isTimely = true;
            if (status === 'confirmed' && app.appointment_date) {
              const appDate = new Date(app.appointment_date);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              yesterday.setHours(0, 0, 0, 0);
              if (appDate < yesterday) {
                isTimely = false;
              }
            }

            // User Request Update: We MUST list Recurrent Patients (status 'confirmed') here 
            // so the doctor can click "Atender".
            // However, we apply the Date Filter (isTimely) to hide old "zombie" confirmed tests.

            const isReady = (hasAnswers || status === 'preconsulta_completed') || (status === 'confirmed' && isTimely);

            return isActive && isReady;
          });
          setAppointments(withPreconsulta);
        } catch (error) {
        } finally {
          setLoadingList(false);
        }
      };
      fetchAppointments();
    }
  }, [appointmentId]);

  // Load patient data
  useEffect(() => {
    const loadData = async () => {
      // 1. Try loading from API if appointmentId exists
      if (appointmentId) {
        try {
          // Fetch appointment
          let appointment = await appointmentService.getAppointment(appointmentId);

          // CRITICAL FIX: Replicate SAME logic as backend /preconsultation/config
          // If current appointment has NO preconsulta_answers, fetch from PREVIOUS appointment
          if (!appointment.preconsulta_answers && appointment.patient_dni) {

            const allAppointments = await appointmentService.getAppointments();
            const previousWithAnswers = allAppointments
              .filter(a =>
                a.patient_dni === appointment.patient_dni &&
                a.id !== appointment.id &&
                a.preconsulta_answers
              )
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (previousWithAnswers) {

              appointment.preconsulta_answers = previousWithAnswers.preconsulta_answers;
            } else {

            }
          }

          let extractedCi = appointment.patient_dni;
          let loadedHistory = null;
          let patientInfo = {};

          // Fetch ALL Previous Consultations if we have CI
          if (extractedCi) {
            try {
              const allHistory = await consultationService.getAllConsultations(extractedCi);
              if (allHistory && allHistory.length > 0) {
                setAllPreviousConsultations(allHistory); // Store all for rendering multiple cards
                loadedHistory = allHistory[0]; // Keep latest for fallback compatibility
              }
            } catch (err) {
              console.error("Error loading history:", err);
            }
          }


          let answers = null;
          try {
            if (appointment.preconsulta_answers) {
              if (typeof appointment.preconsulta_answers === 'string') {
                answers = JSON.parse(appointment.preconsulta_answers);
              } else if (typeof appointment.preconsulta_answers === 'object') {
                answers = appointment.preconsulta_answers;
              }

            }
          } catch (err) {
            console.error("Error parsing preconsulta_answers:", err);
          }

          if (answers) {
            // Case A: Has Answers (New Patient / Filled Form)
            extractedCi = extractedCi || answers.ci;

            // Ensure we don't have nested string issues
            if (typeof answers === 'string') {
              try { answers = JSON.parse(answers); } catch (e) { }
            }

            patientInfo = {
              ...answers,
              full_name: answers.full_name || appointment.patient_name,
              phone: answers.phone || appointment.patient_phone,
              email: answers.email || appointment.patient_email,
              age: answers.age || appointment.patient_age,
              ci: extractedCi || answers.ci || appointment.patient_dni,
              reason_for_visit: appointment.reason_for_visit || answers.reason_for_visit || answers.gyn_reason,

              // BACKFILL: Generate text summaries if missing
              summary_functional_exam: answers.summary_functional_exam || answers.functional_exam_summary || generateFunctionalExamSummary(answers),
              habits_summary: answers.summary_habits || answers.habits_summary || generateHabitsSummary(answers),
              summary_habits: answers.summary_habits || answers.habits_summary || generateHabitsSummary(answers),

              // CRITICAL FIX: Always regenerate full summary from raw data first.
              // Only fallback to stored summary if regeneration returns empty/null.
              summary_gyn_obstetric: formatFullGynObstetricSummary(answers) || answers.summary_gyn_obstetric || answers.obstetric_history_summary
            };
          } else if (loadedHistory) {
            // Case B: No Answers but Has History (Recurrent Patient with missing form)
            // Backfill fields so they are not empty in the form
            patientInfo = {
              full_name: appointment.patient_name,
              phone: appointment.patient_phone,
              email: appointment.patient_email,
              age: appointment.patient_age,
              ci: extractedCi || loadedHistory.patient_ci,
              reason_for_visit: appointment.reason_for_visit || "Control Recurrente",

              // Map History -> Preconsulta Fields (Match Backend Model Keys)
              personal_history: loadedHistory.personal_history,
              family_history_mother: loadedHistory.family_history_mother,
              family_history_father: loadedHistory.family_history_father,
              supplements: loadedHistory.supplements,
              surgical_history: loadedHistory.surgical_history,
              gyn_obstetric_history: loadedHistory.obstetric_history_summary,
              functional_exam: loadedHistory.functional_exam_summary,
              habits: loadedHistory.habits_summary
            };
          } else {
            // Case C: No Answers & No History (New, empty)
            patientInfo = {
              full_name: appointment.patient_name,
              phone: appointment.patient_phone,
              email: appointment.patient_email,
              age: appointment.patient_age,
              ci: extractedCi,
              reason_for_visit: appointment.reason_for_visit
            };
          }

          if (Object.keys(patientInfo).length > 0) {
            setPatientData(patientInfo);
            return; // Success
          }

        } catch (error) {
          console.error("Error loading appointment sequence:", error);
        }
      }

      // 2. Fallback to localStorage
      const stored = localStorage.getItem('current_patient_data');
      if (stored) {
        try {
          setPatientData(JSON.parse(stored));
        } catch (e) {
        }
      }
    };

    loadData();

    // History fetched sequentially above to avoid race conditions
  }, [appointmentId]);

  // Load PDF Settings
  useEffect(() => {
    const storedSettings = localStorage.getItem('pdf_settings');
    if (storedSettings) {
      try {
        setPdfSettings(JSON.parse(storedSettings));
      } catch (e) {
      }
    }
  }, []);

  // Engine for Physical Exam
  const {
    currentNode,
    answers,
    isFinished,
    goToNext,
    goToPrevious,
    hasPrevious,
    reset
  } = usePreconsultaEngine(physicalExamFlow);

  const renderPatientSummary = () => {
    // If no patient data, we can return null.
    // The main view will handle showing the History Card if it exists,
    // or the empty state if absolutely nothing exists.
    if (!patientData) return null;

    const Section = ({ title, children }) => (
      <div className="mb-6 last:mb-0">
        {title && <h4 className="text-base font-bold text-black border-b border-gray-200 pb-1 mb-2 uppercase tracking-wider">{title}</h4>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {children}
        </div>
      </div>
    );

    const Field = ({ label, value, fullWidth = false }) => {
      if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') return null;

      let displayValue = value;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Sí' : 'No';
      } else if (String(value).toLowerCase() === 'true') {
        displayValue = 'Sí';
      } else if (String(value).toLowerCase() === 'false') {
        displayValue = 'No';
      }

      return (
        <div className={`${fullWidth ? 'col-span-full' : ''} flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-sm`}>
          <span className="font-bold text-gray-700 dark:text-gray-400 min-w-fit">{label}:</span>
          <span className="text-gray-900 dark:text-gray-200 break-words">{String(displayValue)}</span>
        </div>
      );
    };

    const ModernCard = ({ title, icon: Icon, children, className = "", headerColor = "bg-gray-50 dark:bg-gray-700", borderColor = "border-gray-200 dark:border-gray-700", gridCols = "md:grid-cols-2" }) => (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 ${borderColor} overflow-hidden ${className}`}>
        {title && (
          <div className={`${headerColor} px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2`}>
            {Icon && <Icon className="text-lg opacity-70" />}
            <h4 className="text-sm font-bold uppercase tracking-wide inherit-color">{title}</h4>
          </div>
        )}
        <div className={`p-6 grid grid-cols-1 ${gridCols} gap-x-6 gap-y-4`}>
          {children}
        </div>
      </div>
    );

    return (
      <div className="space-y-6 mb-8">
        {/* Datos Personales (Full Card) */}
        <ModernCard
          title="Datos Personales"
          icon={FaUserCircle}
          headerColor="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          borderColor="border-blue-200 dark:border-blue-800"
          gridCols="md:grid-cols-3"
        >
          <Field label="Nombre Completo" value={patientData.full_name} fullWidth />
          <Field label="Cédula de Identidad" value={patientData.ci} />
          <Field label="Edad" value={patientData.age ? `${patientData.age} años` : null} />
          <Field label="Email" value={patientData.email} />
          <Field label="Teléfono" value={patientData.phone} />
          <Field label="Ocupación" value={patientData.occupation} />
          <Field label="Dirección" value={patientData.address} />
        </ModernCard>

        {/* Motivo de Consulta & Suplementos (Highlighted Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 relative overflow-hidden">
            <FaCommentMedical className="absolute top-4 right-4 text-6xl text-indigo-100 dark:text-indigo-900/40 -rotate-12" />
            <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 relative z-10">
              <FaCommentMedical /> Motivo de Consulta
            </h4>
            <p className="text-lg font-medium text-indigo-900 dark:text-indigo-200 relative z-10">{patientData.reason_for_visit || patientData.gyn_reason || "No especificado"}</p>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl border-2 border-teal-200 dark:border-teal-800 relative overflow-hidden">
            <FaPills className="absolute top-4 right-4 text-6xl text-teal-100 dark:text-teal-900/40 rotate-12" />
            <h4 className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2 relative z-10">
              <FaPills /> Suplementos Activos
            </h4>
            <p className="text-lg font-medium text-teal-900 dark:text-teal-200 relative z-10">{patientData.supplements || "Niega"}</p>
          </div>
        </div>

        {/* Antecedentes Médicos */}
        <ModernCard title="Antecedentes Médicos" icon={FaNotesMedical} headerColor="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" borderColor="border-blue-200 dark:border-blue-800">
          <Field label="Antecedentes de la Madre" value={patientData.family_history_mother} />
          <Field label="Antecedentes del Padre" value={patientData.family_history_father} />
          <Field label="Antecedentes Personales" value={patientData.personal_history || "Niega"} />
          <Field label="Antecedentes Quirúrgicos" value={patientData.surgical_history} />
        </ModernCard>

        {/* Gineco-Obstetricia */}
        <ModernCard title="Historia Gineco-Obstétrica" icon={FaBaby} headerColor="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" borderColor="border-pink-300 dark:border-pink-800">
          <div className="col-span-full text-sm text-gray-800 dark:text-gray-200 text-justify leading-relaxed font-medium">
            {formatFullGynObstetricSummary(patientData)}
          </div>
        </ModernCard>

        {/* Examen Funcional (Full Width) */}
        {/* Examen Funcional (Grouped & Detailed - Vertical Stack) */}
        <ModernCard title="Examen Funcional" icon={FaStethoscope} headerColor="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" borderColor="border-gray-200 dark:border-gray-600" gridCols="grid-cols-1">
          {/* Algias Pélvicas */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-xs uppercase tracking-wider">Algias Pélvicas</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Dispareunia:</span>
                <span className="text-gray-900 dark:text-gray-200">
                  {patientData.functional_dispareunia === 'Sí' || patientData.functional_dispareunia === true ? (
                    <>
                      <span className="font-bold text-blue-700 dark:text-white">Refiere</span>
                      {patientData.functional_dispareunia_type && ` - ${patientData.functional_dispareunia_type}`}
                      {(patientData.functional_dispareunia_deep_scale !== null && patientData.functional_dispareunia_deep_scale !== undefined) && ` (${patientData.functional_dispareunia_deep_scale}/10)`}
                    </>
                  ) : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Dolor pélvico/piernas:</span>
                <span className="text-gray-900 dark:text-gray-200">
                  {patientData.functional_leg_pain === 'Sí' || patientData.functional_leg_pain === true ? (
                    <>
                      <span className="font-bold text-blue-700 dark:text-white">Refiere</span>
                      {patientData.functional_leg_pain_type && patientData.functional_leg_pain_type.length > 0 &&
                        ` - ${Array.isArray(patientData.functional_leg_pain_type) ? patientData.functional_leg_pain_type.join(', ') : patientData.functional_leg_pain_type}`}
                      {patientData.functional_leg_pain_zone && patientData.functional_leg_pain_zone.length > 0 &&
                        ` (${Array.isArray(patientData.functional_leg_pain_zone) ? patientData.functional_leg_pain_zone.join(', ') : patientData.functional_leg_pain_zone})`}
                    </>
                  ) : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Disquecia:</span>
                <span className="text-gray-900 dark:text-gray-200">
                  {patientData.functional_dischezia === 'Sí' || patientData.functional_dischezia === true ? (
                    <>
                      <span className="font-bold text-blue-700 dark:text-white">Refiere</span>
                      {(patientData.functional_dischezia_scale !== null && patientData.functional_dischezia_scale !== undefined) && ` ${patientData.functional_dischezia_scale}/10`}
                    </>
                  ) : (patientData.functional_dischezia === 'Eventual' ? 'Eventual' : <span className="text-gray-500 dark:text-white italic">Niega</span>)}
                </span>
              </div>
            </div>
          </div>

          {/* Función Gastrointestinal */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-xs uppercase tracking-wider">Función Gastrointestinal</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Antes de menstruación"
                value={(Array.isArray(patientData.functional_gastro_before) ? patientData.functional_gastro_before.join(', ') : patientData.functional_gastro_before) || "Niega"}
              />
              <Field
                label="Durante menstruación"
                value={(Array.isArray(patientData.functional_gastro_during) ? patientData.functional_gastro_during.join(', ') : patientData.functional_gastro_during) || "Niega"}
              />
              <Field
                label="Hábito Evacuatorio"
                value={patientData.functional_bowel_freq || "No reportado"}
              />
            </div>
          </div>

          {/* Función Urinaria */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-xs uppercase tracking-wider">Función Urinaria</h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Problemas Urinarios:</span>
                <span className="text-gray-900 dark:text-gray-200">
                  {patientData.functional_urinary_problem === 'Sí' || patientData.functional_urinary_problem === true ?
                    <span className="font-bold text-blue-700 dark:text-white">Refiere</span> :
                    <span className="text-gray-500 dark:text-white italic">Niega</span>
                  }
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Dolor al Orinar:</span>
                <span className="text-gray-900 dark:text-gray-200">
                  {patientData.functional_urinary_pain === 'Sí' || patientData.functional_urinary_pain === true ? (
                    <>
                      <span className="font-bold text-blue-700 dark:text-white">Refiere</span>
                      {(patientData.functional_urinary_pain_scale !== null && patientData.functional_urinary_pain_scale !== undefined) && ` (${patientData.functional_urinary_pain_scale}/10)`}
                    </>
                  ) : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Irritación vesical:</span>
                <span className="font-medium">
                  {patientData.functional_urinary_irritation === 'Sí' || patientData.functional_urinary_irritation === true ? <span className="font-bold text-blue-700 dark:text-white">Refiere</span> : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Incontinencia:</span>
                <span className="font-medium">
                  {patientData.functional_urinary_incontinence === 'Sí' || patientData.functional_urinary_incontinence === true ? <span className="font-bold text-blue-700 dark:text-white">Refiere</span> : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-400 mr-1">Nocturia:</span>
                <span className="font-medium">
                  {patientData.functional_urinary_nocturia === 'Sí' || patientData.functional_urinary_nocturia === true ? <span className="font-bold text-blue-700 dark:text-white">Refiere</span> : <span className="text-gray-500 dark:text-white italic">Niega</span>}
                </span>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Hábitos (Full Width) */}
        <ModernCard title="Hábitos Psicobiológicos" icon={FaRunning} headerColor="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" borderColor="border-green-200 dark:border-green-800">
          <Field label="Tabaco" value={patientData.habits_smoking} />
          <Field label="Alcohol" value={patientData.habits_alcohol} />
          <Field label="Actividad Física" value={patientData.habits_physical_activity} />
          <Field label="Sustancias" value={patientData.habits_substance_use} />
        </ModernCard>
      </div>
    );
  };

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);
      setAppointments(appointments.filter(app => app.id !== appointmentToDelete.id));
      success("Preconsulta eliminada correctamente");
      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      toastError("Error al eliminar la preconsulta");
    }
  };

  const renderDeleteModal = () => (
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      title="Eliminar Preconsulta"
      size="sm"
      darkMode={darkMode}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que deseas eliminar la preconsulta de <strong>{appointmentToDelete?.patient_name}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );

  const renderAppointmentsList = () => {
    if (loadingList) {
      return <div className="p-8 text-center">Cargando preconsultas...</div>;
    }

    if (appointments.length === 0) {
      return (
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">No hay preconsultas pendientes</h3>
          <p className="text-gray-500 mt-2">Las citas con preconsulta completada aparecerán aquí.</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preconsultas en Tránsito</h3>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {appointments.map((app) => (
              <li key={app.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(app.appointment_date).toLocaleDateString()} {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {(() => {
                    const statusConfig = {
                      'preconsulta_completed': { label: 'Lista', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
                      'scheduled': { label: 'Programada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
                      'pending': { label: 'Pendiente', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
                      'cancelled': { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
                    };
                    const config = statusConfig[app.status] || { label: app.status, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
                    return (
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color} border border-transparent`}>
                        {config.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {app.patient_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registrado: {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/consultation?appointment_id=${app.id}`)}
                    className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Ver / Atender
                  </button>
                  <button
                    onClick={() => handleDeleteClick(app)}
                    className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Cita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {new Date(app.appointment_date).toLocaleDateString()} {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {app.patient_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(() => {
                      const statusConfig = {
                        'preconsulta_completed': { label: 'Lista para Atender', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
                        'scheduled': { label: 'Programada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
                        'pending': { label: 'Pendiente', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
                        'cancelled': { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
                      };
                      const config = statusConfig[app.status] || { label: app.status, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };

                      return (
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color} border border-transparent`}>
                          {config.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/consultation?appointment_id=${app.id}`)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-md transition-colors"
                    >
                      Ver / Atender
                    </button>
                    <button
                      onClick={() => handleDeleteClick(app)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-md transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExamContent = () => {
    if (examMode === 'manual') {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Examen Físico Manual</h3>
          <textarea
            value={manualExamText}
            onChange={(e) => setManualExamText(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-48 bg-white dark:bg-gray-700 dark:text-white"
            placeholder="Escriba aquí el examen físico completo..."
          />
          <button
            onClick={() => setExamMode(null)}
            className="text-sm text-gray-600 dark:text-gray-400 underline hover:text-gray-800 dark:hover:text-gray-200 mt-2"
          >
            Cancelar y volver
          </button>
        </div>
      );
    }

    if (examMode === 'wizard') {
      if (isFinished) {
        const summary = formatPhysicalExamSummary(answers);
        return (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Examen Físico Completado</h3>
                <p className="text-green-700 dark:text-green-400 text-sm">Resumen generado automáticamente:</p>
              </div>
              <button
                onClick={() => {
                  reset();
                  setExamMode('wizard');
                }}
                className="text-xs text-green-600 underline hover:text-green-800"
              >
                Reiniciar / Editar
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-100 dark:border-green-900 text-gray-800 dark:text-gray-200 text-justify leading-relaxed shadow-sm">
              {summary}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  const ultrasoundInput = document.querySelector('textarea[placeholder*="ultrasonido"]');
                  if (ultrasoundInput) {
                    ultrasoundInput.focus();
                    ultrasoundInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                Continuar a Ultrasonido ↓
              </button>
            </div>
          </div>
        );
      }

      // Render current node
      const label = currentNode.text_key ? doctorExamTexts[currentNode.text_key] || currentNode.text_key : 'Pregunta';

      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center">
          <div className="mb-4 flex justify-between items-center w-full">
            {hasPrevious && (
              <button onClick={goToPrevious} className="text-sm text-gray-500 hover:text-gray-700">
                ← Volver
              </button>
            )}
            <button onClick={() => setExamMode(null)} className="text-xs text-red-500 hover:text-red-700 ml-auto">
              Cancelar
            </button>
          </div>

          <div className="w-full flex justify-center">
            {renderInput(currentNode, label)}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
        <h3 className="text-xl font-medium mb-6 dark:text-white">¿Desea usar la plantilla de examen físico normal?</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => setExamMode('wizard')}
            className="text-white py-3 px-8 rounded-lg hover:opacity-90 transition-colors font-medium w-full sm:w-auto"
            style={{ backgroundColor: primaryColor }}
          >
            Sí, usar plantilla
          </button>
          <button
            onClick={() => setExamMode('manual')}
            className="bg-white dark:bg-gray-700 text-black dark:text-white border-2 border-black dark:border-gray-500 py-3 px-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium w-full sm:w-auto"
          >
            No, ingresar manualmente
          </button>
        </div>
      </div >
    );
  };

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [modalState, setModalState] = useState('initial'); // 'initial', 'sending', 'success'
  const [consultationResult, setConsultationResult] = useState(null);

  const handleSaveConsultation = async () => {
    if (!patientData) {
      toastError("No hay datos del paciente para guardar.");
      return;
    }

    // Determine physical exam content
    let physicalExamContent = "";
    if (examMode === 'wizard' && isFinished) {
      // Format wizard answers
      physicalExamContent = formatPhysicalExamSummary(answers);
    } else if (manualExamText) {
      physicalExamContent = manualExamText;
    } else {
      physicalExamContent = "No realizado / No registrado";
    }

    const payload = {
      // Patient Info (Map from patientData)
      full_name: patientData.full_name || "Desconocido",
      ci: patientData.ci || "N/A",
      age: patientData.age ? String(patientData.age) : "N/A",
      phone: patientData.phone || "N/A",
      address: patientData.address || "N/A",
      occupation: patientData.occupation || "N/A",

      // Pre-consultation
      reason_for_visit: patientData.reason_for_visit || "",
      family_history_mother: Array.isArray(patientData.family_history_mother) ? patientData.family_history_mother.join(', ') : (patientData.family_history_mother || "Niega"),
      family_history_father: Array.isArray(patientData.family_history_father) ? patientData.family_history_father.join(', ') : (patientData.family_history_father || "Niega"),
      personal_history: Array.isArray(patientData.personal_history) ? patientData.personal_history.join(', ') : (patientData.personal_history || "Niega"),
      supplements: Array.isArray(patientData.supplements) ? patientData.supplements.join(', ') : (patientData.supplements || "Niega"),
      surgical_history: Array.isArray(patientData.surgical_history) ? patientData.surgical_history.join(', ') : (patientData.surgical_history || "Niega"),
      summary_gyn_obstetric: formatFullGynObstetricSummary(patientData),
      summary_functional_exam: patientData.summary_functional_exam,
      summary_habits: patientData.summary_habits,

      // Doctor Inputs
      admin_physical_exam: physicalExamContent,
      admin_ultrasound: ultrasound,
      admin_diagnosis: diagnosis,
      admin_plan: plan,
      admin_observations: observations,

      doctor_id: 1, // Hardcoded for now
      // history_number is auto-generated by backend
      appointment_id: appointmentId ? parseInt(appointmentId) : null
    };

    try {
      const result = await consultationService.createConsultation(payload);
      setConsultationResult(result); // Store result to get ID
      setModalState('initial');
      setIsSuccessModalOpen(true);
    } catch (error) {
      toastError(`Error al guardar la consulta: ${error.message}`);
    }
  };

  const handleSendReport = async () => {
    if (!patientData?.email) {
      toastError("El paciente no tiene un email registrado.");
      return;
    }

    setModalState('sending');
    try {
      await consultationService.sendReport(consultationResult.consultation_id, patientData.email);
      setModalState('success');

      // Redirect after showing success
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error("Error sending report:", error);
      toastError("Error al enviar el correo. Inténtalo de nuevo.");
      setModalState('initial');
    }
  };

  const handleNewConsultation = () => {
    setIsNewConsultationModalOpen(true);
  };

  const confirmNewConsultation = () => {
    // Clear local storage
    localStorage.removeItem('current_patient_data');
    // Reset state
    setPatientData(null);
    setExamMode(null);
    setManualExamText('');
    setUltrasound('');
    setDiagnosis('');
    setPlan('');
    setObservations('');
    setActiveSection('physical_exam');
    setIsNewConsultationModalOpen(false);
  };

  const renderInput = (node, label) => {
    switch (node.type) {
      case 'buttons':
        return <ButtonSelection label={label} options={node.options || []} onNext={goToNext} />;
      case 'yes_no':
        return <YesNoInput label={label} onNext={goToNext} />;
      case 'checklist':
        const checklistOptions = node.options || (node.keyboard_type ? PRECONSULTA_OPTIONS[node.keyboard_type] : []) || [];
        return <ChecklistInput label={label} onNext={goToNext} keyboardType={node.keyboard_type} options={checklistOptions} />;
      case 'numeric_input':
        return <NumericInput label={label} onNext={goToNext} />;
      case 'text_input':
        return <TextInput label={label} onNext={goToNext} />;
      default:
        return <div>Tipo de entrada no soportado: {node.type}</div>;
    }
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Preconsultas</h1>
            </div>
          </div>
          {renderAppointmentsList()}
          {renderDeleteModal()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/consultation')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <span>←</span> Lista
            </button>
            <h1 className="text-3xl font-bold ml-2 text-gray-900 dark:text-white">Consulta Médica</h1>
          </div>
        </div>

        {renderPatientSummary()}


        {allPreviousConsultations.length > 0 && allPreviousConsultations.map((history, index) => (
          <div key={history.created_at} className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
              <FaHistory /> Consulta #{allPreviousConsultations.length - index} ({new Date(history.created_at).toLocaleDateString()})
            </h3>
            <div className="flex flex-col gap-6">
              {/* Row 1: Examen Físico */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">Examen Físico Anterior</h4>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line text-sm leading-relaxed">{history.physical_exam || "Sin registro"}</p>
              </div>

              {/* Row 2: Ultrasonido */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">Ultrasonido Anterior</h4>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed text-justify">{history.ultrasound || "Sin registro"}</p>
              </div>

              {/* Row 3: Diagnóstico */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">Diagnóstico Anterior</h4>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{history.diagnosis || "Sin registro"}</p>
              </div>

              {/* Row 4: Plan */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">Plan Anterior</h4>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{history.plan || "Sin registro"}</p>
              </div>

              {/* Row 5: Observaciones */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm">
                <h4 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">Observaciones Anteriores</h4>
                <p className="text-gray-800 dark:text-gray-200 text-sm">{history.observations || "Sin registro"}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="space-y-8">
          {/* 1. Examen Físico */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: primaryColor }}>1</span>
              Examen Físico
            </h2>
            {renderExamContent()}
          </section>

          {/* 2. Ultrasonido Transvaginal */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: primaryColor }}>2</span>
              Ultrasonido Transvaginal
            </h2>
            <textarea
              value={ultrasound}
              onChange={(e) => setUltrasound(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-32 bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Describa los hallazgos del ultrasonido..."
            />
          </section>

          {/* 3. Diagnóstico */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: primaryColor }}>3</span>
              Diagnóstico
            </h2>
            <ListBuilder
              value={diagnosis}
              onChange={setDiagnosis}
              placeholder="Agregar diagnóstico..."
            />
          </section>

          {/* 4. Plan */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: primaryColor }}>4</span>
              Plan
            </h2>
            <ListBuilder
              value={plan}
              onChange={setPlan}
              placeholder="Agregar ítem al plan..."
            />
          </section>

          {/* 5. Observaciones */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: primaryColor }}>5</span>
              Observaciones
            </h2>
            <ListBuilder
              value={observations}
              onChange={setObservations}
              placeholder="Agregar observación..."
            />
          </section>

          <div className="flex justify-end pt-6">
            <button
              onClick={handleSaveConsultation}
              className="text-white py-4 px-8 rounded-lg font-bold text-lg hover:opacity-90 transition-colors shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Guardar Consulta
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {renderDeleteModal()}

        {/* New Consultation Confirmation Modal */}
        <Modal
          isOpen={isNewConsultationModalOpen}
          onClose={() => setIsNewConsultationModalOpen(false)}
          title="Nueva Consulta"
          size="sm"
          darkMode={darkMode}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center text-yellow-100 bg-yellow-100 w-12 h-12 rounded-full mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 text-center">
              ¿Estás seguro de que deseas iniciar una nueva consulta? Se borrarán los datos actuales de la pantalla.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setIsNewConsultationModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="text-white hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                onClick={confirmNewConsultation}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
        {/* Success Modal */}
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            if (modalState !== 'sending') {
              setIsSuccessModalOpen(false);
              navigate('/dashboard'); // Default to home/dashboard
            }
          }}
          title={modalState === 'success' ? "¡Enviado!" : "Consulta Guardada"}
          size="md"
          darkMode={darkMode}
        >
          <div className="space-y-6 text-center py-4">

            {modalState === 'initial' && (
              <>
                <div className="flex items-center justify-center text-green-100 bg-green-100 w-16 h-16 rounded-full mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                    Consulta guardada correctamente
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    ¿Deseas enviar el informe médico al paciente ahora?
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleSendReport}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: primaryColor,
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    className="transform hover:scale-[1.02]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar Informe
                  </button>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                  >
                    Inicio
                  </button>
                </div>
              </>
            )}

            {modalState === 'sending' && (
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-indigo-600 font-medium animate-pulse">Enviando informe al paciente...</p>
              </div>
            )}

            {modalState === 'success' && (
              <div className="py-4 flex flex-col items-center justify-center animate-fade-in-up">
                <div className="flex items-center justify-center text-green-100 bg-green-100 w-20 h-20 rounded-full mb-4 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ¡Enviado con Éxito!
                </h3>
                <p className="text-gray-500">Redirigiendo al inicio...</p>
              </div>
            )}

          </div>
        </Modal>
      </div >
    </div >
  );
};

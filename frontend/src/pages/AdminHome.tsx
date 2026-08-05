import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useToast } from '../components/Toast'

interface Grade {
  id: number;
  name: string;
  description: string | null;
}

interface Subject {
  id: number;
  name: string;
}

interface Session {
  id: number;
  grade_id: number;
  subject_id: number;
  title: string;
  pin: string;
  is_active: boolean;
  started_at: string | null;
}

interface SessionInfo {
  id: number;
  grade_id: number;
  grade_name: string;
  subject_name: string;
  title: string;
  is_active: boolean;
  started_at: string | null;
  created_at: string | null;
  file_count: number;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [starting, setStarting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const { error } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesData, subjectsData, sessionsData] = await Promise.all([
          apiFetch<Grade[]>('/grades'),
          apiFetch<Subject[]>('/subjects'),
          apiFetch<SessionInfo[]>('/sessions'),
        ]);
        setGrades(gradesData);
        setSubjects(subjectsData);
        setSessionCount(sessionsData.length);
        setFileCount(sessionsData.reduce((sum, s) => sum + s.file_count, 0));
      } catch {
        setGrades([]);
        setSubjects([]);
        setSessionCount(0);
        setFileCount(0);
      }
    };
    fetchData();
  }, []);

  const startSession = async () => {
    if (!selectedGrade) {
      error('Selecciona un grado');
      return;
    }
    if (!selectedSubject) {
      error('Selecciona una asignatura');
      return;
    }
    if (!sessionTitle.trim()) {
      error('Ingresa un título para la sesión');
      return;
    }

    setStarting(true);
    try {
      const session = await apiFetch<Session>('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          grade_id: Number(selectedGrade),
          subject_id: Number(selectedSubject),
          title: sessionTitle.trim(),
        }),
      });
      navigate(`/admin/session/${session.id}`, {
        state: { pin: session.pin, gradeId: session.grade_id, sessionId: session.id, title: session.title },
      });
    } catch (err) {
      error('Error al iniciar la sesión: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setStarting(false);
    }
  };

  const canStart = selectedGrade && selectedSubject && sessionTitle.trim();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-soft flex justify-between items-center relative overflow-hidden">
        <div className="z-10 max-w-lg">
          <h2 className="text-gray-400 font-medium text-lg mb-1">¡Bienvenido de nuevo!</h2>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Panel de Transferencia Local</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Inicia una sesión seleccionando un grado, una asignatura y un título para compartir archivos en tiempo real.
          </p>
          
          {grades.length === 0 ? (
            <p className="text-xs text-gray-400 font-medium bg-gray-50 px-4 py-2.5 rounded-full border border-gray-100">
              No hay grados creados aún. Ve a <b>Grados</b> para crear uno.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <select 
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 pl-4 pr-10 py-3 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all cursor-pointer hover:border-brand-purple/50"
                  >
                    <option value="" disabled hidden>Seleccionar grado</option>
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">unfold_more</span>
                </div>
                <div className="relative flex-1 min-w-[180px]">
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 pl-4 pr-10 py-3 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all cursor-pointer hover:border-brand-purple/50"
                  >
                    <option value="" disabled hidden>Seleccionar asignatura</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">unfold_more</span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Título de la sesión"
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all placeholder:text-gray-400"
                />
                <button 
                  onClick={startSession}
                  disabled={starting || !canStart}
                  style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
                  className={`bg-[#7b68ee] text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-indigo-600 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 whitespace-nowrap ${
                    starting || !canStart ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">sensors</span>
                  {starting ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:flex right-8 top-1/2 transform w-60 h-44 bg-brand-purpleLight rounded-2xl items-center justify-center border-2 border-indigo-100 flex-col gap-2 p-4 text-center">
          <span className="material-symbols-outlined text-brand-purple text-4xl">wifi_tethering</span>
          <span className="text-xs font-semibold text-brand-purple">Red Local Activa</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          style={{ backgroundColor: '#7b68ee' }}
          className="bg-[#7b68ee] rounded-3xl p-5 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-200"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white">school</span>
          </div>
          <h4 className="text-3xl font-extrabold text-white">{grades.length}</h4>
          <p className="text-xs text-white font-medium mt-1">Grados Registrados</p>
        </div>

        <div 
          style={{ backgroundColor: '#00b8d9' }}
          className="bg-[#00b8d9] rounded-3xl p-5 text-white flex flex-col items-center justify-center shadow-lg shadow-cyan-200"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white">book</span>
          </div>
          <h4 className="text-3xl font-extrabold text-white">{subjects.length}</h4>
          <p className="text-xs text-white font-medium mt-1">Asignaturas</p>
        </div>

        <div 
          style={{ backgroundColor: '#ff7675' }}
          className="bg-[#ff7675] rounded-3xl p-5 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-200"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white">folder</span>
          </div>
          <h4 className="text-3xl font-extrabold text-white">{fileCount}</h4>
          <p className="text-xs text-white font-medium mt-1">Archivos Guardados</p>
        </div>

        <div 
          style={{ backgroundColor: '#00b894' }}
          className="bg-[#00b894] rounded-3xl p-5 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-200"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white">check_circle</span>
          </div>
          <h4 className="text-3xl font-extrabold text-white">{sessionCount}</h4>
          <p className="text-xs text-white font-medium mt-1">Sesiones Realizadas</p>
        </div>
      </div>
    </div>
  )
}

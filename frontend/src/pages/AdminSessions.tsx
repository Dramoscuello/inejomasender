import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmModal'

interface SessionInfo {
  id: number;
  grade_id: number;
  grade_name: string;
  subject_id: number;
  subject_name: string;
  title: string;
  pin: string;
  is_active: boolean;
  started_at: string | null;
  created_at: string | null;
  file_count: number;
}

interface Session {
  id: number;
  grade_id: number;
  subject_id: number;
  title: string;
  pin: string;
  is_active: boolean;
}

export default function AdminSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [relaunching, setRelaunching] = useState<number | null>(null);
  const { success, error } = useToast();
  const confirm = useConfirm();

  const fetchSessions = async () => {
    try {
      const data = await apiFetch<SessionInfo[]>('/sessions');
      setSessions(data);
    } catch (err) {
      error('Error al cargar sesiones: ' + (err instanceof Error ? err.message : 'Desconocido'));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const relaunchSession = async (s: SessionInfo) => {
    setRelaunching(s.id);
    try {
      const session = await apiFetch<Session>('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          grade_id: s.grade_id,
          subject_id: s.subject_id,
          title: s.title,
        }),
      });
      success('Sesión relanzada con nuevo PIN');
      navigate(`/admin/session/${session.id}`, {
        state: { pin: session.pin, gradeId: session.grade_id, sessionId: session.id, title: session.title },
      });
    } catch (err) {
      error('Error al relanzar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setRelaunching(null);
    }
  };

  const handleDelete = async (s: SessionInfo) => {
    const ok = await confirm({
      title: 'Eliminar sesión',
      message: `¿Eliminar "${s.title}" y sus ${s.file_count} archivos? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar todo',
      danger: true,
    });
    if (!ok) return;

    try {
      await apiFetch(`/sessions/${s.id}`, { method: 'DELETE' });
      setSessions(sessions.filter(x => x.id !== s.id));
      success('Sesión y archivos eliminados');
    } catch (err) {
      error('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Historial de Sesiones</h2>
        <p className="text-sm text-gray-400">Revisa, relanza o elimina sesiones pasadas.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-soft">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando sesiones...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">history</span>
            <p className="text-gray-500 font-medium">No hay sesiones registradas.</p>
            <p className="text-xs text-gray-400 mt-1">Inicia una sesión desde el <b>Dashboard</b>.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-brand-textMuted uppercase font-semibold">
                  <th className="py-3 px-4">Título</th>
                  <th className="py-3 px-4">Grado</th>
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Archivos</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-gray-800">{s.title}</td>
                    <td className="py-4 px-4 text-gray-500">{s.grade_name}</td>
                    <td className="py-4 px-4 text-gray-500">{s.subject_name}</td>
                    <td className="py-4 px-4 text-gray-500 text-xs">{formatDate(s.started_at || s.created_at)}</td>
                    <td className="py-4 px-4 text-gray-500">{s.file_count}</td>
                    <td className="py-4 px-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
                          Finalizada
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => relaunchSession(s)}
                          disabled={relaunching === s.id}
                          className="p-2 text-gray-400 hover:text-brand-purple transition-colors"
                          title="Relanzar sesión"
                        >
                          <span className="material-symbols-outlined text-lg">{relaunching === s.id ? 'hourglass_top' : 'replay'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                          title="Eliminar sesión"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

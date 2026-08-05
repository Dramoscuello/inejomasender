import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmModal'

interface Subject {
  id: number;
  name: string;
}

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { success, error } = useToast();
  const confirm = useConfirm();

  const fetchSubjects = async () => {
    try {
      const data = await apiFetch<Subject[]>('/subjects');
      setSubjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const created = await apiFetch<Subject>('/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: newSubjectName }),
      });
      setSubjects([created, ...subjects]);
      success('Asignatura creada');
    } catch (err) {
      error('Error al crear la asignatura: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      return;
    }

    setNewSubjectName('');
    setIsModalOpen(false);
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await apiFetch<Subject>(`/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName }),
      });
      setSubjects(subjects.map(s => s.id === id ? updated : s));
      setEditingId(null);
      success('Asignatura actualizada');
    } catch (err) {
      error('Error al actualizar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Eliminar asignatura', message: '¿Estás seguro de eliminar esta asignatura?', confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    try {
      await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
      setSubjects(subjects.filter(s => s.id !== id));
      success('Asignatura eliminada');
    } catch (err) {
      error('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Asignaturas</h2>
          <p className="text-sm text-gray-400">Organiza las materias que enseñas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
          className="px-5 py-2.5 bg-[#7b68ee] text-white rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva Asignatura
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Crear Asignatura</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre de la Asignatura</label>
                <input 
                  type="text" 
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="Ej: Matemáticas, Física..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
                  className="px-5 py-2 bg-[#7b68ee] text-white rounded-full text-sm font-medium hover:bg-indigo-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-soft">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando asignaturas...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">menu_book</span>
            <p className="text-gray-500 font-medium">No hay asignaturas registradas aún.</p>
            <p className="text-xs text-gray-400 mt-1">Haz clic en <b>Nueva Asignatura</b> para agregar la primera.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-brand-textMuted uppercase font-semibold">
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    {editingId === s.id ? (
                      <>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleUpdate(s.id)} className="p-2 text-emerald-500 hover:text-emerald-600">
                              <span className="material-symbols-outlined text-lg">check</span>
                            </button>
                            <button onClick={cancelEdit} className="p-2 text-gray-400 hover:text-gray-600">
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-4 font-semibold text-gray-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-purpleLight text-brand-purple flex items-center justify-center font-bold text-xs">
                            <span className="material-symbols-outlined text-sm">book</span>
                          </div>
                          {s.name}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => startEdit(s)} className="p-2 text-gray-400 hover:text-brand-purple transition-colors">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

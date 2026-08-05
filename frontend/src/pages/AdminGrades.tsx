import React, { useState, useEffect } from 'react'
import { apiFetch } from '../api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmModal'

interface Grade {
  id: number;
  name: string;
  description: string | null;
}

export default function AdminGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { success, error } = useToast();
  const confirm = useConfirm();

  const fetchGrades = async () => {
    try {
      const data = await apiFetch<Grade[]>('/grades');
      setGrades(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newGrade = await apiFetch<Grade>('/grades', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || null }),
      });
      setGrades([newGrade, ...grades]);
      success('Grado creado correctamente');
    } catch (err) {
      error('Error al crear el grado: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      return;
    }

    setName('');
    setDescription('');
    setIsModalOpen(false);
  };

  const startEdit = (g: Grade) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditDescription(g.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await apiFetch<Grade>(`/grades/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, description: editDescription || null }),
      });
      setGrades(grades.map(g => g.id === id ? updated : g));
      setEditingId(null);
      success('Grado actualizado');
    } catch (err) {
      error('Error al actualizar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Eliminar grado', message: '¿Estás seguro de eliminar este grado?', confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    try {
      await apiFetch(`/grades/${id}`, { method: 'DELETE' });
      setGrades(grades.filter(g => g.id !== id));
      success('Grado eliminado');
    } catch (err) {
      error('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Grados</h2>
          <p className="text-sm text-gray-400">Crea y administra los grados de tu institución.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
          className="px-5 py-2.5 bg-[#7b68ee] text-white rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nuevo Grado
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Crear Grado</h3>
            <form onSubmit={handleAddGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre del Grado</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="Ej: 6°, 10°A, 11°B..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="Ej: Jornada mañana..."
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
          <div className="text-center py-12 text-gray-400">Cargando grados...</div>
        ) : grades.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">school</span>
            <p className="text-gray-500 font-medium">No hay grados registrados aún.</p>
            <p className="text-xs text-gray-400 mt-1">Haz clic en <b>Nuevo Grado</b> para crear el primero.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-brand-textMuted uppercase font-semibold">
                  <th className="py-3 px-4">Grado</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {grades.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                    {editingId === g.id ? (
                      <>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                            placeholder="Descripción..."
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleUpdate(g.id)} className="p-2 text-emerald-500 hover:text-emerald-600">
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
                            <span className="material-symbols-outlined text-sm">school</span>
                          </div>
                          {g.name}
                        </td>
                        <td className="py-4 px-4 text-gray-500">{g.description || 'Sin descripción'}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => startEdit(g)} className="p-2 text-gray-400 hover:text-brand-purple transition-colors">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => handleDelete(g.id)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
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

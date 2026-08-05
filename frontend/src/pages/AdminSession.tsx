import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { apiFetch } from '../api'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/ConfirmModal'

interface SharedFile {
  id: number;
  session_id: number | null;
  grade_id: number;
  filename: string;
  file_path: string;
  file_size: number;
}

export default function AdminSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { pin?: string; gradeId?: number; sessionId?: number; title?: string } | null;
  const pin = state?.pin ?? '----';
  const gradeId = state?.gradeId;
  const sessionId = state?.sessionId ?? (id ? Number(id) : null);
  const title = state?.title ?? 'Sesión';

  const [files, setFiles] = useState<SharedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const fetchFiles = useCallback(async () => {
    if (!pin || pin === '----') return;
    try {
      const data = await apiFetch<SharedFile[]>(`/files/session/${pin}`);
      setFiles(data);
    } catch {
      setFiles([]);
    }
  }, [pin]);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 5000);

    if (pin && pin !== '----') {
      const socket = io('/', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('watch-session', { pin });
      });

      socket.on('student-count', (count: number) => {
        setStudentCount(Math.max(0, count - 1));
      });

      socket.on('disconnect', () => {
        setStudentCount(0);
      });

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }

    return () => clearInterval(interval);
  }, [pin, fetchFiles]);

  const handleEndSession = async () => {
    const ok = await confirm({
      title: 'Finalizar sesión',
      message: 'Los estudiantes serán notificados y el PIN dejará de ser válido. Los archivos permanecerán asociados al grado.',
      confirmLabel: 'Finalizar',
      danger: true,
    });
    if (!ok) return;

    if (sessionId) {
      try {
        await apiFetch(`/sessions/end/${sessionId}`, { method: 'POST' });
        socketRef.current?.emit('end-session', { pin });
      } catch {
        socketRef.current?.emit('end-session', { pin });
      }
    }
    socketRef.current?.disconnect();
    navigate('/admin');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gradeId) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('grade_id', String(gradeId));
    formData.append('session_id', String(sessionId));
    formData.append('file', file);

    const token = localStorage.getItem('inejoma_auth_token');

    try {
      const uploaded = await new Promise<SharedFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload');

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Error de conexión al subir el archivo'));
        xhr.send(formData);
      });

      setFiles([uploaded, ...files]);
      success('Archivo subido correctamente');
    } catch (err) {
      toastError('Error al subir: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    const ok = await confirm({
      title: 'Eliminar archivo',
      message: '¿Eliminar este archivo de la sesión?',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/files/${fileId}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== fileId));
      success('Archivo eliminado');
    } catch (err) {
      toastError('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 flex flex-col items-center max-w-4xl mx-auto">
      <div className="flex justify-between items-center w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          </div>
          <p className="text-sm text-gray-400">Los estudiantes conectados pueden recibir tus archivos al instante.</p>
        </div>

        <button 
          onClick={handleEndSession}
          className="bg-rose-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">stop_circle</span>
          Finalizar Sesión
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-soft w-full text-center relative overflow-hidden">
        <p className="text-xs font-semibold text-brand-textMuted uppercase tracking-widest mb-2">PIN de la Clase</p>
        <div className="text-6xl md:text-7xl font-extrabold text-brand-purple tracking-widest my-4 font-mono">
          {pin}
        </div>
        
        <div className="inline-flex items-center gap-2 bg-brand-purpleLight text-brand-purple px-4 py-1.5 rounded-full text-sm font-medium">
          <span className="material-symbols-outlined text-sm">group</span>
          <span>{studentCount} {studentCount === 1 ? 'Estudiante conectado' : 'Estudiantes conectados'}</span>
        </div>
      </div>

      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`w-full bg-white rounded-3xl p-8 shadow-soft border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors ${
          uploading ? 'border-brand-purple cursor-default' : 'border-indigo-100 cursor-pointer hover:border-brand-purple'
        }`}
      >
        {uploading ? (
          <div className="w-full max-w-xs space-y-4">
            <div className="flex items-center gap-3 justify-center">
              <span className="material-symbols-outlined text-brand-purple text-2xl animate-spin">sync</span>
              <span className="text-sm font-medium text-gray-700">Subiendo archivo... {uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-purple h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{uploadProgress < 100 ? 'No cierres esta ventana' : 'Procesando...'}</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-brand-purpleLight text-brand-purple flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Arrastra archivos aquí o haz clic</h3>
            <p className="text-xs text-gray-400 mb-6">Comparte PDF, ZIP, imágenes o documentos sin límite de tamaño.</p>
            <button 
              style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
              className="bg-[#7b68ee] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Seleccionar Archivo
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {files.length > 0 && (
        <div className="w-full bg-white rounded-3xl p-6 shadow-soft">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Archivos compartidos ({files.length})</h3>
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">description</span>
                  <span className="text-sm text-gray-700 font-medium">{f.filename}</span>
                  <span className="text-xs text-gray-400">({formatSize(f.file_size)})</span>
                </div>
                <button
                  onClick={() => handleDeleteFile(f.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                  title="Eliminar archivo"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

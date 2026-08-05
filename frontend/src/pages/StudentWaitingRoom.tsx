import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { apiFetch } from '../api'

interface SharedFile {
  id: number;
  grade_id: number;
  filename: string;
  file_path: string;
  file_size: number;
}

export default function StudentWaitingRoom() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchFiles = async () => {
    try {
      const data = await apiFetch<SharedFile[]>(`/files/session/${pin}`);
      setFiles(data);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 5000);

    if (pin) {
      const socket = io('/', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-session', { pin });
      });

      socket.on('session-ended', () => {
        socket.disconnect();
        navigate('/');
      });

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }

    return () => clearInterval(interval);
  }, [pin, navigate]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDownload = (id: number) => {
    window.open(`/api/files/download/${id}`, '_blank');
  };

  const handleDownloadZip = () => {
    window.open(`/api/files/download-zip/${pin}`, '_blank');
  };

  return (
    <div className="bg-[#f8f9fe] min-h-screen flex flex-col font-sans text-brand-text">
      <header className="w-full py-6 px-8 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="font-bold text-brand-purple text-xl">InejomaSender</span>
          </div>

          <div className="bg-brand-purpleLight text-brand-purple font-semibold text-sm px-4 py-1.5 rounded-full font-mono">
            PIN: {pin}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-soft text-center">
          <div className="w-12 h-12 rounded-full bg-cyan-100 text-cyan-500 flex items-center justify-center mx-auto mb-3 animate-spin">
            <span className="material-symbols-outlined text-2xl">sync</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Esperando nuevos archivos...</h2>
          <p className="text-sm text-gray-400">Los archivos que comparta el profesor aparecerán en esta lista automáticamente.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-bold text-gray-800">Archivos Recibidos ({files.length})</h3>
            {files.length > 0 && (
              <button 
                onClick={handleDownloadZip}
                className="bg-brand-blue text-white px-5 py-2 rounded-full text-xs font-medium hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-400/20 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Descargar Todo (.ZIP)
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 shadow-soft text-center text-gray-400 text-sm">
              Cargando archivos...
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 shadow-soft text-center text-gray-400 text-sm">
              Aún no se han enviado archivos en esta sesión.
            </div>
          ) : (
            files.map(f => (
              <div key={f.id} className="bg-white rounded-3xl p-5 shadow-soft flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-purpleLight text-brand-purple flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{f.filename}</h4>
                    <span className="text-xs text-gray-400">{formatSize(f.file_size)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownload(f.id)}
                  className="w-10 h-10 rounded-full bg-gray-50 text-brand-purple flex items-center justify-center hover:bg-brand-purpleLight transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

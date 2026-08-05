import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, setAuthToken } from '../api'

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAuthToken(data.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fe] min-h-screen flex flex-col font-sans text-brand-text">
      {/* Header */}
      <header className="w-full py-6 px-8">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="font-bold text-brand-purple text-xl">InejomaSender</span>
          </div>

          <button 
            onClick={() => navigate('/')}
            style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7b68ee] text-white hover:bg-indigo-600 rounded-full font-medium text-sm transition-all shadow-md shadow-indigo-200"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            Vista Estudiante
          </button>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-100 border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-purpleLight text-brand-purple flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Ingresa tus credenciales para administrar la plataforma.</p>

          {error && (
            <div className="mb-4 text-xs font-semibold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Usuario</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:bg-white transition-all"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
              className={`w-full py-3.5 mt-2 bg-[#7b68ee] text-white font-medium text-sm rounded-full hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

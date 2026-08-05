
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="text-brand-text font-sans antialiased h-screen flex overflow-hidden bg-[#f8f9fe]">
      {/* Sidebar */}
      <aside className="w-64 bg-white h-full flex flex-col border-r border-gray-100 flex-shrink-0 z-20">
        {/* Brand Header (Logo removed) */}
        <div className="p-6 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-brand-purple text-xl leading-tight">InejomaSender</span>
            <span className="text-xs text-brand-textMuted font-medium">Panel Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 py-4">
          <h3 className="px-4 text-xs text-brand-textMuted uppercase tracking-wider mb-2 font-semibold">Menú Principal</h3>
          
          <NavLink 
            to="/admin" 
            end 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive 
                ? 'bg-brand-purpleLight text-brand-purple' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink 
            to="/admin/grades" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive 
                ? 'bg-brand-purpleLight text-brand-purple' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">school</span>
            Grados
          </NavLink>

          <NavLink 
            to="/admin/subjects" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive 
                ? 'bg-brand-purpleLight text-brand-purple' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">menu_book</span>
            Asignaturas
          </NavLink>

          <NavLink 
            to="/admin/sessions" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive 
                ? 'bg-brand-purpleLight text-brand-purple' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">history</span>
            Sesiones
          </NavLink>
        </nav>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-64 bg-gradient-to-bl from-blue-50 to-transparent -z-10 rounded-bl-full opacity-50"></div>

        {/* Header (Search bar removed) */}
        <header className="flex items-center justify-between px-8 py-6 flex-shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">InejomaSender Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Badge */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-soft border border-gray-100">
              <span className="material-symbols-outlined text-gray-400 text-sm">calendar_today</span>
              <span className="text-sm font-medium text-gray-600 capitalize">{currentDate}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-gutter">
      <span className="material-symbols-outlined text-primary mb-md" style={{ fontSize: '64px' }}>
        search_off
      </span>
      <h1 className="font-display-lg text-[48px] font-bold text-on-surface mb-sm">404</h1>
      <p className="font-body-lg text-on-surface-variant mb-lg">No pudimos encontrar la página que buscas.</p>
      <button 
        onClick={() => navigate('/')}
        className="px-md py-sm bg-primary text-white font-label-md rounded-lg hover:brightness-90 transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  )
}

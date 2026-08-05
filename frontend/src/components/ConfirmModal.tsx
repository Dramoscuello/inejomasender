import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (state) {
      state.resolve(value);
      setState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              state.options.danger ? 'bg-rose-100 text-rose-500' : 'bg-brand-purpleLight text-brand-purple'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {state.options.danger ? 'warning' : 'help'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{state.options.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{state.options.message}</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => handleClose(false)}
                className="px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-full font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleClose(true)}
                style={state.options.danger ? { backgroundColor: '#f43f5e', color: '#fff' } : { backgroundColor: '#7b68ee', color: '#fff' }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  state.options.danger ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-[#7b68ee] text-white hover:bg-indigo-600'
                }`}
              >
                {state.options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

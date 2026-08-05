import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function StudentPin() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleJoin = async (finalPin: string) => {
    setVerifying(true);
    try {
      await apiFetch(`/sessions/verify/${finalPin}`);
      navigate(`/session/${finalPin}`);
    } catch {
      triggerError('PIN incorrecto o expirado. Inténtalo de nuevo.');
    } finally {
      setVerifying(false);
    }
  };

  const triggerError = (msg: string) => {
    setIsError(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setIsError(false);
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }, 1200);
  };

  useEffect(() => {
    const finalPin = pin.join('');
    if (finalPin.length === 4) {
      handleJoin(finalPin);
    }
  }, [pin]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!value) return; 

    value = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (index < 3 && value) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newPin = [...pin];
      if (pin[index] === '') {
        if (index > 0) {
          newPin[index - 1] = '';
          setPin(newPin);
          inputRefs[index - 1].current?.focus();
        }
      } else {
        newPin[index] = '';
        setPin(newPin);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    if (pastedData) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      const nextIndex = pastedData.length < 4 ? pastedData.length : 3;
      inputRefs[nextIndex].current?.focus();
    }
  };

  return (
    <div className="bg-[#f8f9fe] min-h-screen flex flex-col font-sans text-brand-text">
      <header className="w-full py-6 px-8">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="font-bold text-brand-purple text-xl">InejomaSender</span>
          </div>

          <button 
            onClick={() => navigate('/login')}
            style={{ backgroundColor: '#7b68ee', color: '#ffffff' }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7b68ee] text-white hover:bg-indigo-600 rounded-full font-medium text-sm transition-all shadow-md shadow-indigo-200"
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Acceso Admin
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className={`w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-100 border transition-all ${
          isError ? 'animate-shake border-rose-500 shadow-rose-100' : 'border-gray-100'
        } text-center`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
            isError ? 'bg-rose-100 text-rose-500' : 'bg-brand-purpleLight text-brand-purple'
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isError ? 'error_outline' : verifying ? 'hourglass_top' : 'devices'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ingresar PIN</h1>
          <p className="text-sm text-gray-400 mb-6">Escribe el código de 4 dígitos provisto por tu profesor.</p>

          {errorMessage && (
            <div className="mb-4 text-xs font-semibold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {errorMessage}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleJoin(pin.join('')); }} className="space-y-6">
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  autoComplete="off"
                  autoFocus={index === 0}
                  disabled={verifying}
                  className={`w-14 h-16 text-center text-3xl font-extrabold bg-gray-50 border rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:bg-white transition-all uppercase shadow-inner ${
                    isError 
                      ? 'border-rose-400 focus:ring-rose-400 text-rose-600' 
                      : 'border-gray-200 focus:ring-brand-purple'
                  } ${verifying ? 'opacity-50' : ''}`}
                  maxLength={1}
                  type="text"
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                />
              ))}
            </div>

            <button 
              style={{ backgroundColor: isError ? '#f43f5e' : '#7b68ee', color: '#ffffff' }}
              className={`w-full py-3.5 text-white font-medium text-sm rounded-full transition-all shadow-md ${
                isError ? 'bg-rose-500 shadow-rose-200' : 'bg-[#7b68ee] hover:bg-indigo-600 shadow-indigo-200'
              } ${pin.join('').length < 4 || verifying ? 'opacity-50 cursor-not-allowed' : ''}`} 
              type="submit"
              disabled={pin.join('').length < 4 || verifying}
            >
              {verifying ? 'Verificando...' : 'Unirse a la Clase'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

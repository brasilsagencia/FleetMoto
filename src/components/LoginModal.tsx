import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Bike
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { login, loginWithGoogle, register, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<'administrador' | 'gestor' | 'atendente' | 'cliente'>('administrador');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela de login do Google fechada antes da conclusão.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('O navegador bloqueou a janela pop-up do Google. Permita pop-ups para este site.');
      } else {
        setErrorMsg(`Falha na autenticação via Google: ${err.message || err.code || 'Tente novamente.'}`);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (mode === 'forgot') {
      try {
        await resetPassword(email);
        setSuccessMsg('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
      } catch (err: any) {
        setErrorMsg(`Erro ao enviar recuperação: ${err.message || 'E-mail não encontrado.'}`);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
        if (onClose) onClose();
      } else {
        if (!nome.trim()) {
          setErrorMsg('Informe o nome completo do usuário.');
          return;
        }
        await register(email, password, nome, role);
        setSuccessMsg('Conta criada com sucesso no Firebase!');
        if (onClose) onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado no sistema.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha fornecida é muito fraca. Use letras e números.');
      } else {
        setErrorMsg(`Erro de autenticação: ${err.message || err.code || 'Falha ao autenticar.'}`);
      }
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string, demoNome: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    try {
      await login(demoEmail, demoPass);
      if (onClose) onClose();
    } catch {
      // If doesn't exist yet, try creating it directly for seamless demo
      try {
        await register(demoEmail, demoPass, demoNome, 'administrador');
        if (onClose) onClose();
      } catch (err: any) {
        setErrorMsg('Não foi possível conectar a conta de teste: ' + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#E05328]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#E05328] flex items-center justify-center shadow-md">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold tracking-tight">FleetMoto Eleições 2026</h3>
                <span className="text-[10px] bg-orange-500/30 text-orange-200 font-bold px-1.5 py-0.5 rounded border border-orange-400/30">
                  Firebase Auth
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {mode === 'login' && 'Faça login para acessar o painel de logística'}
                {mode === 'register' && 'Cadastrar novo operador de campanha'}
                {mode === 'forgot' && 'Recuperação de senha via e-mail'}
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'border-[#E05328] text-[#E05328] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar com Senha</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-[#E05328] text-[#E05328] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="flex-1">{successMsg}</p>
            </div>
          )}

          {/* 1. GOOGLE LOGIN BUTTON (Requested) */}
          <div className="space-y-2">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-3 shadow-xs hover:border-slate-400 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 absolute">
                ou com e-mail e senha
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silveira"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@campanha.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#E05328] hover:underline font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Função / Cargo no Sistema
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white text-slate-800"
                  >
                    <option value="administrador">Administrador Geral</option>
                    <option value="gestor">Operador de Logística</option>
                    <option value="atendente">Fiscal de Campanha</option>
                    <option value="cliente">Representante de Comitê</option>
                  </select>
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <span>Processando...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar Sistema</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Conta no Firebase</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Enviar Link de Recuperação</span>
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                ← Voltar para o Login
              </button>
            </div>
          )}

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Acesso Rápido de Teste:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@fleetmoto.com.br', '123456', 'Roberto Silveira (Admin)')}
                className="p-2 text-left bg-slate-50 hover:bg-orange-50 hover:border-orange-200 border border-slate-200 rounded-lg transition-colors"
              >
                <p className="text-[11px] font-bold text-slate-800">Admin Geral</p>
                <p className="text-[10px] text-slate-500 truncate">admin@fleetmoto.com.br</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('gestor@fleetmoto.com.br', '123456', 'Carlos Eduardo (Gestor)')}
                className="p-2 text-left bg-slate-50 hover:bg-orange-50 hover:border-orange-200 border border-slate-200 rounded-lg transition-colors"
              >
                <p className="text-[11px] font-bold text-slate-800">Gestor Operacional</p>
                <p className="text-[10px] text-slate-500 truncate">gestor@fleetmoto.com.br</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

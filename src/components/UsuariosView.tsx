import React from 'react';
import { ShieldCheck, UserCheck, Plus, UserPlus, LogOut, LogIn } from 'lucide-react';
import { Usuario } from '../types';

interface UsuariosViewProps {
  usuarios: Usuario[];
  onSelectUser: (user: Usuario) => void;
  currentUser: Usuario;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  onSelectUser,
  currentUser,
  onOpenLogin,
  onLogout,
  isAuthenticated = true,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Controle de Acessos & Perfis de Usuários
          </h2>
          <p className="text-xs text-slate-500">
            Autenticação integrada com Google e credenciais criptografadas via Firebase Auth
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Novo Usuário</span>
            </button>
          )}

          {isAuthenticated && onLogout && (
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sair da Conta (Logout)"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sair da Conta</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {usuarios.map((usr) => {
          const isCurrent = usr.id === currentUser.id;

          return (
            <div
              key={usr.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 flex flex-col justify-between transition-all ${
                isCurrent ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={usr.avatarUrl}
                    alt={usr.nome}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{usr.nome}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-[#E05328] border border-orange-200">
                      {usr.papel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <p className="truncate"><strong>E-mail:</strong> {usr.email}</p>
                  <p><strong>Último acesso:</strong> {usr.ultimoAcesso}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isCurrent ? (
                  <span className="text-xs font-bold text-orange-600 flex items-center justify-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    Perfil Ativo Atual
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectUser(usr)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Alternar para este Perfil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

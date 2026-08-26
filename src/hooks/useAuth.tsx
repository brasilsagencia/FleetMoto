import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { usuariosRepo } from '../repositories';
import { UsuarioDoc, UserRole } from '../models/firebase.types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UsuarioDoc | null;
  role: UserRole;
  isLoading: boolean;
  isOnline: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, nome: string, role?: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleDebug: (role: UserRole) => void;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UsuarioDoc | null>(null);
  const [role, setRole] = useState<UserRole>('administrador');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        try {
          const profile = await usuariosRepo.findByEmail(user.email);
          if (profile) {
            setUserProfile(profile);
            setRole(profile.role || 'administrador');
          } else {
            // Default profile for new authenticated users
            const fallbackProfile: UsuarioDoc = {
              id: user.uid,
              nome: user.displayName || user.email.split('@')[0] || 'Usuário Eleitoral',
              email: user.email,
              avatarUrl: user.photoURL || undefined,
              role: 'administrador',
              status: 'ativo',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false
            };
            setUserProfile(fallbackProfile);
            setRole('administrador');
            usuariosRepo.setWithId(user.uid, fallbackProfile).catch(console.error);
          }
        } catch (err) {
          console.warn('Erro ao carregar perfil do Firestore:', err);
        }
      } else {
        // Fallback default active state when not logged in to Firebase Auth
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await usuariosRepo.findByEmail(email);
      if (profile) {
        setUserProfile(profile);
        setRole(profile.role);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;
      if (user.email) {
        let profile = await usuariosRepo.findByEmail(user.email);
        if (!profile) {
          profile = {
            id: user.uid,
            nome: user.displayName || user.email.split('@')[0] || 'Gestor Google',
            email: user.email,
            avatarUrl: user.photoURL || undefined,
            role: 'administrador',
            status: 'ativo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false
          };
          await usuariosRepo.setWithId(user.uid, profile);
        }
        setUserProfile(profile);
        setRole(profile.role);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, nome: string, userRole: UserRole = 'administrador') => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nome });
      }
      const newProfile: UsuarioDoc = {
        id: cred.user.uid,
        nome,
        email: email.toLowerCase(),
        role: userRole,
        status: 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };
      await usuariosRepo.setWithId(cred.user.uid, newProfile);
      setUserProfile(newProfile);
      setRole(userRole);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
    setRole('administrador');
  };

  const switchRoleDebug = (newRole: UserRole) => {
    setRole(newRole);
    if (userProfile) {
      setUserProfile({ ...userProfile, role: newRole });
    }
  };

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (role === 'administrador') return true;
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        isLoading,
        isOnline,
        login,
        loginWithGoogle,
        register,
        resetPassword,
        logout,
        switchRoleDebug,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};


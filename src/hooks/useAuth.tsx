
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (menuId: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Criar perfil padrão para novo usuário
        const defaultProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          nome: user.displayName || user.email?.split('@')[0] || '',
          role: 'secretario', // Papel padrão
          ativo: true
        };
        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const hasAccess = (menuId: string): boolean => {
    if (!userProfile) return false;
    
    const rolePermissions: Record<UserRole, string[]> = {
      administrador: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio', 'usuarios'],
      diretor: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio'],
      coordenador: ['disciplinas', 'turmas', 'gerador', 'horarios', 'professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
      secretario: ['professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
      professor: ['academico', 'notas', 'relatorio']
    };
    
    return rolePermissions[userProfile.role]?.includes(menuId) || false;
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    hasAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

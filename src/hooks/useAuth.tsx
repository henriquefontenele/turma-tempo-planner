
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
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        
        // Buscar permissões do perfil de acesso
        if (profile.role) {
          const perfilDoc = await getDoc(doc(db, 'perfis-acesso', profile.role));
          if (perfilDoc.exists()) {
            const perfilData = perfilDoc.data();
            // Normalizar permissões vindas do Firestore para os IDs de menu
            const knownItems = [
              { id: 'disciplinas', label: 'Disciplinas' },
              { id: 'professores', label: 'Professores' },
              { id: 'turmas', label: 'Turmas' },
              { id: 'escolas', label: 'Escolas' },
              { id: 'config', label: 'Turnos' },
              { id: 'usuarios', label: 'Usuários' },
              { id: 'perfis', label: 'Perfis de Acesso' },
              { id: 'alunos', label: 'Alunos' },
              { id: 'matricula', label: 'Matrícula' },
              { id: 'gerador', label: 'Gerador' },
              { id: 'horarios', label: 'Horários' },
              { id: 'academico', label: 'Frequência' },
              { id: 'notas', label: 'Notas' },
              { id: 'relatorio', label: 'Relatório' },
            ];

            const normalize = (val: string): string | null => {
              if (!val) return null;
              const slug = String(val)
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

              // match direto por id
              if (knownItems.some((k) => k.id === slug)) return slug;

              // match por label normalizado
              const byLabel = knownItems.find(
                (k) =>
                  k.label
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') === slug
              );
              if (byLabel) return byLabel.id;

              // sinônimos comuns / plural-singular
              const synonyms: Record<string, string> = {
                frequencia: 'academico',
                relatorios: 'relatorio',
                relatorio: 'relatorio',
                turno: 'config',
                turnos: 'config',
                configuracao: 'config',
                configuracoes: 'config',
                horario: 'horarios',
                horarios: 'horarios',
                aluno: 'alunos',
                alunos: 'alunos',
                matriculas: 'matricula',
                professor: 'professores',
                professores: 'professores',
                turma: 'turmas',
                turmas: 'turmas',
                disciplina: 'disciplinas',
                disciplinas: 'disciplinas',
                escola: 'escolas',
                escolas: 'escolas',
                usuario: 'usuarios',
                usuarios: 'usuarios',
                perfil: 'perfis',
                perfis: 'perfis',
                nota: 'notas',
                notas: 'notas',
                geradores: 'gerador',
              };

              return synonyms[slug] || null;
            };

            const rawPerms: string[] = [
              ...(perfilData.permissoes || []),
              ...(perfilData.permissoesHerdadas || []),
            ].map((p: any) => String(p));

            const normalized = Array.from(
              new Set(
                rawPerms
                  .map((p) => normalize(p))
                  .filter(Boolean) as string[]
              )
            );

            if (normalized.length > 0) {
              setUserPermissions(normalized);
            } else {
              // Fallback para permissões padrão se nada corresponder
              const defaultPermissions: Record<UserRole, string[]> = {
                administrador: [
                  'disciplinas',
                  'professores',
                  'turmas',
                  'escolas',
                  'config',
                  'alunos',
                  'matricula',
                  'gerador',
                  'horarios',
                  'academico',
                  'notas',
                  'relatorio',
                  'usuarios',
                  'perfis',
                ],
                diretor: [
                  'disciplinas',
                  'professores',
                  'turmas',
                  'escolas',
                  'config',
                  'alunos',
                  'matricula',
                  'gerador',
                  'horarios',
                  'academico',
                  'notas',
                  'relatorio',
                ],
                coordenador: [
                  'disciplinas',
                  'turmas',
                  'gerador',
                  'horarios',
                  'professores',
                  'matricula',
                  'alunos',
                  'academico',
                  'notas',
                  'relatorio',
                ],
                secretario: [
                  'professores',
                  'matricula',
                  'alunos',
                  'academico',
                  'notas',
                  'relatorio',
                ],
                professor: ['academico', 'notas', 'relatorio'],
              };
              setUserPermissions(defaultPermissions[profile.role] || []);
            }
          } else {
            // Fallback para permissões padrão se o perfil não existir
            const defaultPermissions: Record<UserRole, string[]> = {
              administrador: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio', 'usuarios', 'perfis'],
              diretor: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio'],
              coordenador: ['disciplinas', 'turmas', 'gerador', 'horarios', 'professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
              secretario: ['professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
              professor: ['academico', 'notas', 'relatorio']
            };
            setUserPermissions(defaultPermissions[profile.role] || []);
          }
        }
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
        setUserPermissions(['professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio']);
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
        setUserPermissions([]);
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
    return userPermissions.includes(menuId);
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

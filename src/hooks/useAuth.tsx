
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
      console.log('🔍 Carregando perfil do usuário:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        console.log('👤 Perfil do usuário:', profile);

        // Normaliza o role para garantir correspondência correta
        const roleRaw = String(profile.role || '').trim().toLowerCase();
        console.log('🎭 Role bruto:', profile.role, '-> normalizado:', roleRaw);
        
        const roleMap: Record<string, UserRole> = {
          administrador: 'administrador',
          diretor: 'diretor',
          coordenador: 'coordenador',
          secretario: 'secretario',
          professor: 'professor',
          admin: 'administrador',
          diretora: 'diretor',
          coordenadora: 'coordenador',
          secretaria: 'secretario',
          docente: 'professor',
          teacher: 'professor',
        };
        const roleKey: UserRole = roleMap[roleRaw] || 'secretario';
        console.log('🔑 Role key final:', roleKey);
        
        // Converte diferentes formatos (array, objeto, string) em lista de tokens
        const collectFrom = (input: any): string[] => {
          if (!input) return [];
          if (Array.isArray(input)) return input.map(String);
          if (typeof input === 'string')
            return input.split(/[;,]+/).map((s) => s.trim()).filter(Boolean);
          if (typeof input === 'object')
            return Object.entries(input)
              .filter(([, v]) => Boolean(v))
              .map(([k]) => String(k));
          return [];
        };

        // Função recursiva para buscar permissões e grupos herdados (suporta string ou array)
        const getPermissoesHerdadas = async (
          perfilIdInput: string | string[],
          visited: Set<string> = new Set()
        ): Promise<{ perms: string[]; groups: string[] }> => {
          const result = { perms: [] as string[], groups: [] as string[] };

          const merge = (a: string[], b: string[]) => {
            for (const v of b) if (v) a.push(String(v));
          };

          const handleSingle = async (perfilId: string) => {
            if (!perfilId) return;
            if (visited.has(perfilId)) {
              console.warn('⚠️ Ciclo detectado na herança de perfis:', perfilId);
              return;
            }
            visited.add(perfilId);

            const perfilDoc = await getDoc(doc(db, 'perfis-acesso', perfilId));
            if (!perfilDoc.exists()) return;

            const perfilData: any = perfilDoc.data();

            // Coleta permissões e grupos deste perfil
            merge(result.perms, collectFrom(perfilData.permissoes));
            merge(result.perms, collectFrom(perfilData.permissoesHerdadas));
            merge(result.perms, collectFrom(perfilData.menus));
            merge(result.perms, collectFrom(perfilData.acessos));
            merge(result.perms, collectFrom(perfilData.items));
            merge(result.perms, collectFrom(perfilData.itens));

            merge(result.groups, collectFrom(perfilData.grupos));
            merge(result.groups, collectFrom(perfilData.groups));
            merge(result.groups, collectFrom(perfilData.gruposAcesso));

            // Heranças em cadeia
            const nextParents = perfilData.herdarDe || perfilData.herdaDe || perfilData.inherit || perfilData.inherits;
            if (nextParents) {
              console.log(`🔗 Perfil ${perfilId} herda de:`, nextParents);
              const nested = await getPermissoesHerdadas(nextParents, visited);
              merge(result.perms, nested.perms);
              merge(result.groups, nested.groups);
            }
          };

          if (Array.isArray(perfilIdInput)) {
            for (const pid of perfilIdInput) {
              await handleSingle(String(pid));
            }
          } else {
            await handleSingle(String(perfilIdInput));
          }

          // Retorna únicos
          return {
            perms: Array.from(new Set(result.perms)),
            groups: Array.from(new Set(result.groups)),
          };
        };

        // Buscar permissões do perfil de acesso
        if (roleKey) {
          console.log('📂 Buscando perfil de acesso:', `perfis-acesso/${roleKey}`);
          const perfilDoc = await getDoc(doc(db, 'perfis-acesso', roleKey));
          if (perfilDoc.exists()) {
            const perfilData = perfilDoc.data();
            console.log('📋 Dados do perfil de acesso:', perfilData);
            
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

            const groupMap: Record<string, string[]> = {
              cadastro: ['disciplinas','professores','turmas','escolas','config'],
              usuarios: ['usuarios','perfis'],
              matricula: ['alunos','matricula'],
              horario: ['gerador','horarios'],
              academico: ['academico','notas','relatorio'],
            };

            const allIds = knownItems.map((k) => k.id);

            const slugify = (val: string) => String(val)
              .trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');

            // Normaliza item individual para id de menu
            const normalize = (val: string): string | null => {
              if (!val) return null;
              const slug = slugify(val);

              // match direto por id
              if (knownItems.some((k) => k.id === slug)) return slug;

              // match por label normalizado
              const byLabel = knownItems.find(
                (k) => slugify(k.label) === slug
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

            // Normaliza nome de grupo para lista de ids
            const normalizeGroup = (val: string): string[] | null => {
              const s = slugify(val);
              const groupSyn: Record<string, string> = {
                cadastro: 'cadastro',
                usuarios: 'usuarios',
                usuario: 'usuarios',
                matricula: 'matricula',
                matriculas: 'matricula',
                horario: 'horario',
                horarios: 'horario',
                'horario-grupo': 'horario',
                'horarios-grupo': 'horario',
                'usuarios-grupo': 'usuarios',
                'cadastro-grupo': 'cadastro',
                'matricula-grupo': 'matricula',
                'academico-grupo': 'academico',
                academicos: 'academico',
              };
              const key = groupMap[s] ? s : groupSyn[s];
              return key && groupMap[key] ? groupMap[key] : null;
            };

            // Buscar permissões herdadas recursivamente (perms e groups)
            let inherited = { perms: [] as string[], groups: [] as string[] };
            if (perfilData.herdarDe) {
              console.log('🔗 Processando herança de:', perfilData.herdarDe);
              inherited = await getPermissoesHerdadas(perfilData.herdarDe);
              console.log('📥 Permissões herdadas:', inherited);
            }

            // Coleta permissões (arrays, objetos com booleans ou strings) e grupos
            let rawPerms: string[] = [
              ...inherited.perms, // Adiciona permissões herdadas primeiro
              ...collectFrom(perfilData.permissoes),
              ...collectFrom(perfilData.permissoesHerdadas),
              ...collectFrom(perfilData.menus),
              ...collectFrom(perfilData.acessos),
              ...collectFrom(perfilData.items),
              ...collectFrom(perfilData.itens),
            ];

            const rawGroups: string[] = [
              ...inherited.groups, // Grupos herdados primeiro
              ...collectFrom(perfilData.grupos),
              ...collectFrom(perfilData.groups),
              ...collectFrom(perfilData.gruposAcesso),
            ];

            // Herança de outros perfis (se houver)
            const inherits = collectFrom(perfilData.herdaDe || perfilData.inherit || perfilData.inherits);
            if (inherits.length) {
              try {
                const inheritedDocs = await Promise.all(
                  inherits.map(async (r) => {
                    const rStr = String(r);
                    const slug = slugify(rStr);
                    const candidates = [
                      (roleMap as any)[slug] as string | undefined,
                      slug,
                      rStr,
                    ].filter(Boolean) as string[];

                    for (const id of candidates) {
                      try {
                        const d = await getDoc(doc(db, 'perfis-acesso', id));
                        if (d.exists()) return d;
                      } catch {}
                    }
                    return null;
                  })
                );

                inheritedDocs.forEach((d) => {
                  if (d && d.exists()) {
                    const p: any = d.data();
                    rawPerms.push(
                      ...collectFrom(p.permissoes),
                      ...collectFrom(p.permissoesHerdadas),
                      ...collectFrom(p.menus),
                      ...collectFrom(p.acessos),
                      ...collectFrom(p.items),
                      ...collectFrom(p.itens)
                    );
                    rawGroups.push(
                      ...collectFrom(p.grupos),
                      ...collectFrom(p.groups),
                      ...collectFrom(p.gruposAcesso)
                    );
                  }
                });
              } catch (e) {
                console.warn('⚠️ Erro ao carregar perfis herdados:', e);
              }
            }

            console.log('📝 Permissões brutas:', rawPerms, '| grupos:', rawGroups);

            // Expande tokens para ids finais
            const expanded = new Set<string>();
            const addMany = (arr: string[]) => arr.forEach((id) => expanded.add(id));

            const starTokens = new Set(['*', 'all', 'tudo', 'todos']);
            rawPerms.forEach((t) => {
              const s = slugify(String(t));
              if (starTokens.has(s)) {
                addMany(allIds);
                return;
              }
              const id = normalize(t);
              if (id) expanded.add(id);
            });

            rawGroups.forEach((g) => {
              const ids = normalizeGroup(g);
              if (ids) addMany(ids);
            });

            const normalized = Array.from(expanded);


            console.log('✅ Permissões normalizadas:', normalized);

            if (normalized.length > 0) {
              setUserPermissions(normalized);
              console.log('✓ Permissões definidas:', normalized);
            } else {
              console.log('⚠️ Nenhuma permissão normalizada, usando fallback');

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
              setUserPermissions(defaultPermissions[roleKey] || []);
              console.log('✓ Permissões fallback definidas:', defaultPermissions[roleKey]);
            }
          } else {
            console.log('⚠️ Perfil de acesso não encontrado, usando fallback');
            // Fallback para permissões padrão se o perfil não existir
            const defaultPermissions: Record<UserRole, string[]> = {
              administrador: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio', 'usuarios', 'perfis'],
              diretor: ['disciplinas', 'professores', 'turmas', 'escolas', 'config', 'alunos', 'matricula', 'gerador', 'horarios', 'academico', 'notas', 'relatorio'],
              coordenador: ['disciplinas', 'turmas', 'gerador', 'horarios', 'professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
              secretario: ['professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorio'],
              professor: ['academico', 'notas', 'relatorio']
            };
            setUserPermissions(defaultPermissions[roleKey] || []);
            console.log('✓ Permissões fallback definidas:', defaultPermissions[roleKey]);
          }
        }
      } else {
        console.log('⚠️ Usuário não encontrado, criando perfil padrão');

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

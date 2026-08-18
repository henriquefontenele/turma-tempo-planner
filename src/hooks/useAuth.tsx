
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
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types';
import { MODULO_IDS_COM_PERMISSAO, MODULO_IDS_VISIVEIS_COM_PERMISSAO, buildPermissaoParaModulos } from '@/config/modulos';

// Módulos padrão por papel legado, quando não há perfis-acesso configurado.
// Extraído para um único lugar — antes esta tabela estava duplicada em dois pontos de loadUserProfile.
const MODULOS_PADRAO_POR_ROLE: Record<UserRole, string[]> = {
  administrador: MODULO_IDS_VISIVEIS_COM_PERMISSAO,
  diretor: ['disciplinas','professores','turmas','escolas','alunos','matricula','gerador','horarios','academico','notas','relatorios','cursos-ead','modulos-ead','aulas-ead','matriculas-ead','fidelidade','eventos'],
  coordenador: ['disciplinas','turmas','gerador','horarios','professores','matricula','alunos','academico','notas','relatorios','cursos-ead','modulos-ead','aulas-ead','matriculas-ead','fidelidade','eventos'],
  secretario: ['professores','matricula','alunos','academico','notas','relatorios','cursos-ead','modulos-ead','matriculas-ead','fidelidade'],
  professor: ['academico','notas','relatorios','matriculas-ead'],
};

// Módulos padrão para um usuário recém-criado (perfil ainda não existia em `users`) ou quando
// o carregamento de permissões falha antes do perfil terminar de carregar.
const MODULOS_PADRAO_NOVO_USUARIO = ['professores', 'matricula', 'alunos', 'academico', 'notas', 'relatorios'];

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
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const loadUserProfile = async (user: User) => {
    let profileLoaded = false;
    try {
      console.log('🔍 Carregando perfil do usuário:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        profileLoaded = true;
        console.log('👤 Perfil do usuário:', profile);

        // Normaliza o role para garantir correspondência correta
        const roleRaw = String(profile.role || '').trim();
        const roleLower = roleRaw.toLowerCase();
        console.log('🎭 Valor de role no perfil:', profile.role, '-> lower:', roleLower);

        // ADMIN: acesso total imediato, sem depender de perfis-acesso
        if (roleLower === 'administrador' || roleLower === 'admin' || user.email === 'henriquefontenele@gmail.com') {
          console.log('🔑 ADMIN detectado! Concedendo acesso total.');
          setUserPermissions(MODULO_IDS_VISIVEIS_COM_PERMISSAO);
          setPermissionsLoaded(true);
          return; // Não precisa carregar perfis-acesso
        }
        
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
        // Se o valor de role for um nome conhecido, usamos como fallback; caso contrário, ele pode ser o ID de um documento em perfis-acesso
        const roleKey: UserRole | null = roleMap[roleLower] || null;
        console.log('🔑 Role key (legado) para fallback:', roleKey);
        
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

        // Buscar perfil de acesso priorizando o ID salvo no usuário; se não existir, tentar pelo role "legado"
        console.log('📂 Buscando perfil de acesso do usuário:', profile.role);
        let perfilData: any | null = null;
        try {
          const byAssigned = await getDoc(doc(db, 'perfis-acesso', String(profile.role)));
          if (byAssigned.exists()) {
            perfilData = byAssigned.data();
            console.log('✅ Perfil encontrado por ID:', byAssigned.id, perfilData);
          }
        } catch (e) {
          console.warn('⚠️ Erro ao buscar perfil por ID:', e);
        }
        if (!perfilData && roleKey) {
          console.log('📂 Tentando perfil de acesso por roleKey (legado):', roleKey);
          try {
            const byRoleKey = await getDoc(doc(db, 'perfis-acesso', roleKey));
            if (byRoleKey.exists()) {
              perfilData = byRoleKey.data();
              console.log('✅ Perfil encontrado por roleKey:', roleKey, perfilData);
            }
          } catch (e) {
            console.warn('⚠️ Erro ao buscar perfil por roleKey:', e);
          }
        }

        if (perfilData) {
          console.log('📋 Dados do perfil de acesso:', perfilData);

          // Lista de módulos disponíveis no app (para expandir o token "*"/"tudo")
          const allMenuIds = MODULO_IDS_COM_PERMISSAO;

          // Mapeia permissões (do PerfisTab) -> menus, a partir do catálogo único
          const permissionToMenus: Record<string, string[]> = buildPermissaoParaModulos();

          // Agregar permissões: próprias + herdadas recursivamente
          let inherited = { perms: [] as string[], groups: [] as string[] };
          if (perfilData.herdarDe) {
            console.log('🔗 Processando herança de:', perfilData.herdarDe);
            inherited = await getPermissoesHerdadas(perfilData.herdarDe);
            console.log('📥 Permissões herdadas:', inherited);
          }

          const collectFrom = (input: any): string[] => {
            if (!input) return [];
            if (Array.isArray(input)) return input.map(String);
            if (typeof input === 'string') return input.split(/[;,]+/).map((s) => s.trim()).filter(Boolean);
            if (typeof input === 'object') return Object.entries(input).filter(([, v]) => Boolean(v)).map(([k]) => String(k));
            return [];
          };

          const rawPerms: string[] = [
            ...inherited.perms,
            ...collectFrom(perfilData.permissoes),
          ];

          console.log('📝 Permissões coletadas (com herança):', rawPerms);

          // Converte permissões em IDs de menu finais
          const expanded = new Set<string>();
          const starTokens = new Set(['*', 'all', 'tudo', 'todos']);

          rawPerms.forEach((perm) => {
            const key = String(perm).trim();
            if (starTokens.has(key.toLowerCase())) {
              allMenuIds.forEach((id) => expanded.add(id));
              return;
            }
            const menus = permissionToMenus[key];
            if (menus) menus.forEach((m) => expanded.add(m));
          });

          const normalized = Array.from(expanded);
          console.log('✅ Menus liberados a partir das permissões:', normalized);

          if (normalized.length > 0) {
            setUserPermissions(normalized);
            setPermissionsLoaded(true);
            console.log('✓ Permissões definidas:', normalized);
          } else {
            console.log('⚠️ Nenhuma permissão mapeada, usando fallback');
            const fallbackKey: UserRole = (roleKey || 'secretario') as UserRole;
            setUserPermissions(MODULOS_PADRAO_POR_ROLE[fallbackKey] || []);
            setPermissionsLoaded(true);
            console.log('✓ Permissões fallback definidas:', MODULOS_PADRAO_POR_ROLE[fallbackKey]);
          }
        } else {
          console.log('⚠️ Perfil de acesso não encontrado, usando fallback');
          const fallbackKey: UserRole = (roleKey || 'secretario') as UserRole;
          setUserPermissions(MODULOS_PADRAO_POR_ROLE[fallbackKey] || []);
          setPermissionsLoaded(true);
          console.log('✓ Permissões fallback definidas:', MODULOS_PADRAO_POR_ROLE[fallbackKey]);
        }
      } else {
        console.log('⚠️ Usuário não encontrado, criando perfil padrão');
        const defaultProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          nome: user.displayName || user.email?.split('@')[0] || '',
          role: 'secretario',
          ativo: true
        };
        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        setUserProfile(defaultProfile);
        setUserPermissions(MODULOS_PADRAO_NOVO_USUARIO);
        setPermissionsLoaded(true);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);

      // Só aplica fallback se o perfil NÃO foi carregado com sucesso nesta execução
      if (!profileLoaded) {
        const fallbackProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          nome: user.displayName || user.email?.split('@')[0] || '',
          role: 'secretario',
          ativo: true,
        };

        setUserProfile(fallbackProfile);
        setUserPermissions(MODULOS_PADRAO_NOVO_USUARIO);
        setPermissionsLoaded(true);
        console.log('⚠️ Fallback aplicado devido a erro:', error);
      } else {
        console.log('⚠️ Erro nas permissões, mas perfil já carregado. Usando hasAccess para admin.');
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setPermissionsLoaded(false);
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
        setUserPermissions([]);
        setPermissionsLoaded(false);
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
    if (!user) return false;
    // While permissions are loading, deny access (show loading state instead)
    if (!permissionsLoaded) return false;
    // Administrador SEMPRE tem acesso total
    const role = userProfile?.role?.toLowerCase?.() || '';
    if (role === 'administrador' || role === 'admin') return true;
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

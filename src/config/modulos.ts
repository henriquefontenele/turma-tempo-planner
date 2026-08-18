import { Permissao } from '@/types';

/**
 * Catálogo único dos módulos do sistema.
 *
 * Antes desta consolidação, a mesma lista de ~21 IDs de módulo estava copiada
 * à mão em cinco lugares (AppSidebar, três pontos em useAuth, PerfisTab e
 * Index.tabNames). Este arquivo é a fonte única de verdade para:
 *  - o menu lateral (AppSidebar)
 *  - o cálculo de hasAccess() (useAuth)
 *  - o título de cabeçalho por aba (Index)
 *  - o filtro por funcionalidade em Perfis de Acesso (PerfisTab)
 *
 * Fase 1 do plano de "instalação de módulos por escola/rede" — puramente uma
 * refatoração de segurança, sem mudar comportamento visível. Ver a análise:
 * https://claude.ai/code/artifact/4346d7db-6e4c-49f8-9a7d-41ee8f5b4240
 */
export interface ModuloDef {
  /** ID usado como activeTab, chave de hasAccess() e valor de menu. */
  id: string;
  /** Rótulo do grupo no menu lateral. */
  grupo: string;
  /** Rótulo curto exibido no menu lateral. */
  label: string;
  /** Título exibido no cabeçalho da página quando esta aba está ativa. Se omitido, usa `label`. */
  titulo?: string;
  emoji: string;
  /**
   * Permissões que, isoladamente, já liberam o acesso a este módulo (OU entre elas).
   * Lista vazia = nenhuma permissão libera automaticamente; só administrador vê.
   */
  permissoes: Permissao[];
  /** Módulo existe e tem permissão própria, mas não tem entrada no menu lateral hoje (órfão). */
  ocultoNoMenu?: boolean;
  /**
   * ID alternativo usado só no filtro de funcionalidades do PerfisTab.
   * Preserva uma inconsistência pré-existente (o filtro usa singular "relatorio",
   * o módulo em si é "relatorios") — não é um erro desta refatoração.
   */
  idFiltroFuncionalidade?: string;
}

export const MODULOS: ModuloDef[] = [
  // CADASTRO
  { id: 'disciplinas', grupo: 'CADASTRO', label: 'Disciplinas', emoji: '📚', permissoes: ['gerenciar_disciplinas'] },
  { id: 'professores', grupo: 'CADASTRO', label: 'Professores', emoji: '👨‍🏫', permissoes: ['gerenciar_professores'] },
  { id: 'turmas', grupo: 'CADASTRO', label: 'Turmas', emoji: '🎓', permissoes: ['gerenciar_turmas'] },
  { id: 'escolas', grupo: 'CADASTRO', label: 'Escolas', emoji: '🏫', permissoes: ['gerenciar_escolas'] },
  { id: 'config', grupo: 'CADASTRO', label: 'Turnos', emoji: '⚙️', permissoes: ['configuracoes_sistema'] },

  // USUÁRIOS
  { id: 'usuarios', grupo: 'USUÁRIOS', label: 'Usuários', emoji: '👤', permissoes: ['gerenciar_usuarios'] },
  { id: 'perfis', grupo: 'USUÁRIOS', label: 'Perfis de Acesso', emoji: '🔒', permissoes: ['gerenciar_perfis'] },

  // SISTEMA — território do operador do sistema (Fase 4 do plano de instalação por escola/rede)
  { id: 'modulos', grupo: 'SISTEMA', label: 'Módulos', titulo: 'Instalação de Módulos', emoji: '📦', permissoes: ['gerenciar_modulos'] },

  // MATRÍCULA
  { id: 'alunos', grupo: 'MATRÍCULA', label: 'Alunos', emoji: '👥', permissoes: ['gerenciar_alunos'] },
  { id: 'matricula', grupo: 'MATRÍCULA', label: 'Matrícula', emoji: '📝', permissoes: ['gerenciar_matriculas'] },

  // EAD
  { id: 'cursos-ead', grupo: 'EAD', label: 'Cursos', titulo: 'Cursos EAD', emoji: '🎬', permissoes: ['gerenciar_cursos_ead'] },
  { id: 'modulos-ead', grupo: 'EAD', label: 'Módulos', titulo: 'Módulos EAD', emoji: '📚', permissoes: ['gerenciar_modulos_ead'] },
  { id: 'aulas-ead', grupo: 'EAD', label: 'Aulas', titulo: 'Aulas EAD', emoji: '📹', permissoes: ['gerenciar_aulas_ead'] },
  { id: 'matriculas-ead', grupo: 'EAD', label: 'Matrículas', titulo: 'Matrículas EAD', emoji: '👨‍💻', permissoes: ['gerenciar_matriculas_ead'] },

  // HORÁRIO
  { id: 'gerador', grupo: 'HORÁRIO', label: 'Gerador', titulo: 'Gerador de Horários', emoji: '🎯', permissoes: ['gerar_horarios'] },
  // Quem tem gerar_horarios também vê Horários hoje — preservado de propósito (era assim em useAuth).
  { id: 'horarios', grupo: 'HORÁRIO', label: 'Horários', emoji: '📅', permissoes: ['gerar_horarios', 'visualizar_horarios'] },

  // ACADÊMICO
  { id: 'academico', grupo: 'ACADÊMICO', label: 'Frequência', emoji: '📋', permissoes: ['gerenciar_academico', 'registrar_frequencia', 'visualizar_frequencia'] },
  { id: 'notas', grupo: 'ACADÊMICO', label: 'Notas', emoji: '📝', permissoes: ['registrar_notas', 'visualizar_notas'] },
  { id: 'relatorios', grupo: 'ACADÊMICO', label: 'Relatórios', emoji: '📊', permissoes: ['acessar_relatorios', 'acessar_relatorios_ead'], idFiltroFuncionalidade: 'relatorio' },

  // FIDELIDADE
  { id: 'fidelidade', grupo: 'FIDELIDADE', label: 'Programa', titulo: 'Programa de Fidelidade', emoji: '🏆', permissoes: ['gerenciar_fidelidade'] },
  // Parceiros nunca teve permissão própria mapeada — hoje só aparece para administrador. Preservado como está.
  { id: 'parceiros', grupo: 'FIDELIDADE', label: 'Parceiros', titulo: 'Parceiros & Vouchers', emoji: '🤝', permissoes: [] },
  // Quem tem gerenciar_fidelidade também vê Eventos hoje — preservado de propósito (era assim em useAuth).
  { id: 'eventos', grupo: 'FIDELIDADE', label: 'Eventos', titulo: 'Eventos e Check-in', emoji: '📅', permissoes: ['gerenciar_fidelidade', 'gerenciar_eventos'] },
];

/** Todos os IDs de módulo, na ordem do catálogo. */
export const MODULO_IDS = MODULOS.map((m) => m.id);

/** IDs com permissão própria (exclui "parceiros", que hoje só abre para administrador). */
export const MODULO_IDS_COM_PERMISSAO = MODULOS.filter((m) => m.permissoes.length > 0).map((m) => m.id);

/** IDs com permissão própria e visíveis no menu lateral (exclui também órfãos como "vagas"). */
export const MODULO_IDS_VISIVEIS_COM_PERMISSAO = MODULOS
  .filter((m) => m.permissoes.length > 0 && !m.ocultoNoMenu)
  .map((m) => m.id);

/** Título de cabeçalho por aba (Index.tsx). */
export const MODULO_TITULOS: Record<string, string> = Object.fromEntries(
  MODULOS.map((m) => [m.id, m.titulo || m.label])
);

/** Mapa permissão -> módulos que ela libera (inverso de ModuloDef.permissoes), usado por useAuth. */
export function buildPermissaoParaModulos(modulos: ModuloDef[] = MODULOS): Record<string, string[]> {
  const mapa: Record<string, string[]> = {};
  for (const modulo of modulos) {
    for (const permissao of modulo.permissoes) {
      (mapa[permissao] ||= []).push(modulo.id);
    }
  }
  return mapa;
}

/** Mapa módulo -> permissões que o liberam, indexado pelo id usado no filtro de funcionalidades do PerfisTab. */
export function buildFuncionalidadeParaPermissoes(modulos: ModuloDef[] = MODULOS): Record<string, Permissao[]> {
  const mapa: Record<string, Permissao[]> = {};
  for (const modulo of modulos) {
    if (modulo.permissoes.length === 0) continue;
    mapa[modulo.idFiltroFuncionalidade || modulo.id] = modulo.permissoes;
  }
  return mapa;
}

/**
 * Resolve se um módulo está habilitado, dada a lista efetiva de módulos
 * instalados (da escola, ou herdada da rede quando a escola não tem lista
 * própria). `null`/`undefined` significa "sem restrição conhecida" — o mesmo
 * que dizer que está tudo habilitado. É a leitura fail-open deliberada: até
 * que o operador do sistema desligue algo explicitamente (ou enquanto a
 * escola ativa não pôde ser resolvida), nada some. Ver Fase 3 do plano:
 * https://claude.ai/code/artifact/4346d7db-6e4c-49f8-9a7d-41ee8f5b4240
 */
export function moduloHabilitado(modulosInstalados: string[] | null | undefined, moduloId: string): boolean {
  if (!modulosInstalados) return true;
  return modulosInstalados.includes(moduloId);
}

/** Grupos de menu na ordem do catálogo, prontos para o AppSidebar (já sem os ocultos). */
export function buildMenuGroups(modulos: ModuloDef[] = MODULOS) {
  const grupos: { label: string; items: { id: string; label: string; emoji: string }[] }[] = [];
  for (const modulo of modulos) {
    if (modulo.ocultoNoMenu) continue;
    let grupo = grupos.find((g) => g.label === modulo.grupo);
    if (!grupo) {
      grupo = { label: modulo.grupo, items: [] };
      grupos.push(grupo);
    }
    grupo.items.push({ id: modulo.id, label: modulo.label, emoji: modulo.emoji });
  }
  return grupos;
}

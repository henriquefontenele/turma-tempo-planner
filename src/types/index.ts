
export interface Disciplina {
  id: string;
  nome: string;
  cargaHorariaSemanal: number;
  permiteAulasGeminadas: boolean;
}

export interface Professor {
  id: string;
  nome: string;
  disciplinas: string[];
  horasManha: number;
  horasTarde: number;
  horasNoite: number;
  diasIndisponiveis: string[];
}

export interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: 'manhã' | 'tarde' | 'noite';
  disciplinas: string[];
  escolaId?: string;
  vagas?: number;
  vagasOcupadas?: number;
}

export interface ConfiguracaoTurno {
  inicioAulas: string;
  fimAulas: string;
  intervalo: string;
  aulasPorDia: number;
}

export interface Configuracoes {
  manhã: ConfiguracaoTurno;
  tarde: ConfiguracaoTurno;
  noite: ConfiguracaoTurno;
}

export interface HorarioGerado {
  id: string;
  turmaId: string;
  grade: {
    [dia: string]: {
      [horario: string]: {
        disciplinaId: string;
        professorId: string;
        disciplinaNome: string;
        professorNome: string;
      } | null;
    };
  };
}

export interface ErroGeracao {
  tipo: 'conflito_professor' | 'carga_horaria_insuficiente' | 'sem_professor_disponivel' | 'configuracao_invalida';
  mensagem: string;
  detalhes?: any;
}

export interface Escola {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  ativa: boolean;
  turnos: ('manhã' | 'tarde' | 'noite')[];
  /** Toda escola vive dentro de uma rede — mesmo avulsa, é uma rede de uma escola só. */
  redeId: string;
  /** Módulos habilitados para esta escola. Ausente = herda 100% da rede (Fase 3 aplica essa regra). */
  modulosHabilitados?: string[];
}

/**
 * Agrupa escolas que compartilham o mesmo pacote de módulos contratado.
 * Toda escola pertence a exatamente uma rede — decisão confirmada na auditoria:
 * https://claude.ai/code/artifact/4346d7db-6e4c-49f8-9a7d-41ee8f5b4240
 */
export interface Rede {
  id: string;
  nome: string;
  /** Módulos habilitados para todas as escolas desta rede (ver Fase 3 para a regra de herança). */
  modulosHabilitados: string[];
  escolaIds: string[];
}

export interface Estudante {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  endereco: string;
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
}

export interface Matricula {
  id: string;
  numeroMatricula: string;
  estudanteId: string;
  escolaId: string;
  turmaId: string;
  dataMatricula: string;
  status: 'ativa' | 'cancelada' | 'transferida';
  observacoes?: string;
}

export interface RegistroFrequencia {
  id: string;
  estudanteId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: string;
  status: 'presente' | 'falta' | 'falta_justificada';
  observacoes?: string;
  justificativa?: string;
}

export interface ResumoFrequencia {
  estudanteId: string;
  disciplinaId: string;
  totalAulas: number;
  presencas: number;
  faltas: number;
  faltasJustificadas: number;
  percentualFrequencia: number;
}

export interface RegistroNota {
  id: string;
  estudanteId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  tipo: 'prova' | 'trabalho' | 'projeto' | 'participacao' | 'recuperacao';
  valor: number;
  valorMaximo: number;
  peso: number;
  descricao: string;
  dataAvaliacao: string;
  observacoes?: string;
}

export interface ResumoNotas {
  estudanteId: string;
  disciplinaId: string;
  notas: RegistroNota[];
  mediaFinal: number;
  situacao: 'aprovado' | 'reprovado' | 'em_andamento';
}

export type UserRole = 'administrador' | 'diretor' | 'coordenador' | 'secretario' | 'professor';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  escolaIds?: string[];
  /** Qual das escolas em escolaIds está "ligada" na sessão, para quem atua em mais de uma. */
  escolaAtivaId?: string;
  ativo: boolean;
  mustResetPassword?: boolean;
}

export type Permissao =
  | 'configuracoes_sistema'
  | 'gerar_horarios'
  | 'visualizar_horarios'
  | 'gerenciar_academico'
  | 'registrar_frequencia'
  | 'visualizar_frequencia'
  | 'registrar_notas'
  | 'visualizar_notas'
  | 'acessar_relatorios'
  | 'acessar_relatorios_ead'

  // ── Redes ───────────────────────────────────────────────────────────────
  | 'visualizar_redes'
  | 'criar_redes'
  | 'editar_redes'
  | 'excluir_redes'

  // ── Escolas ─────────────────────────────────────────────────────────────
  | 'visualizar_escolas'
  | 'criar_escolas'
  | 'editar_escolas'
  | 'excluir_escolas'
  | 'ativar_escolas'

  // ── Turmas ──────────────────────────────────────────────────────────────
  | 'visualizar_turmas'
  | 'criar_turmas'
  | 'editar_turmas'
  | 'excluir_turmas'

  // ── Disciplinas ─────────────────────────────────────────────────────────
  | 'visualizar_disciplinas'
  | 'criar_disciplinas'
  | 'editar_disciplinas'
  | 'excluir_disciplinas'

  // ── Professores ─────────────────────────────────────────────────────────
  | 'visualizar_professores'
  | 'criar_professores'
  | 'editar_professores'
  | 'excluir_professores'

  // ── Alunos (estudantes) ─────────────────────────────────────────────────
  | 'visualizar_alunos'
  | 'criar_alunos'
  | 'editar_alunos'
  | 'excluir_alunos'

  // ── Matrículas ──────────────────────────────────────────────────────────
  | 'visualizar_matriculas'
  | 'criar_matriculas'
  | 'editar_matriculas'
  | 'excluir_matriculas'

  // ── EAD: Cursos ─────────────────────────────────────────────────────────
  | 'visualizar_cursos_ead'
  | 'criar_cursos_ead'
  | 'editar_cursos_ead'
  | 'excluir_cursos_ead'

  // ── EAD: Módulos ────────────────────────────────────────────────────────
  | 'visualizar_modulos_ead'
  | 'criar_modulos_ead'
  | 'editar_modulos_ead'
  | 'excluir_modulos_ead'

  // ── EAD: Aulas ──────────────────────────────────────────────────────────
  | 'visualizar_aulas_ead'
  | 'criar_aulas_ead'
  | 'editar_aulas_ead'
  | 'excluir_aulas_ead'

  // ── EAD: Matrículas ─────────────────────────────────────────────────────
  | 'visualizar_matriculas_ead'
  | 'criar_matriculas_ead'
  | 'editar_matriculas_ead'
  | 'excluir_matriculas_ead'

  // ── Usuários ────────────────────────────────────────────────────────────
  | 'visualizar_usuarios'
  | 'criar_usuarios'
  | 'editar_usuarios'
  | 'excluir_usuarios'
  | 'alterar_perfil_usuario'

  // ── Módulos (instalação por rede/escola) ───────────────────────────────
  | 'visualizar_instalacao_modulos'
  | 'ativar_modulos_rede'
  | 'desativar_modulos_rede'
  | 'ativar_modulos_escola'
  | 'desativar_modulos_escola'

  // ── Perfis de Acesso ────────────────────────────────────────────────────
  | 'visualizar_perfis'
  | 'criar_perfis'
  | 'editar_perfis'
  | 'excluir_perfis'

  // ── Fidelidade (granular — substitui gerenciar_fidelidade/gerenciar_eventos) ──
  | 'fidelidade_visualizar_extrato'
  | 'fidelidade_creditar_pontos'
  | 'fidelidade_visualizar_resgates'
  | 'fidelidade_gerenciar_resgates'
  | 'fidelidade_gerenciar_recompensas'
  | 'fidelidade_configurar_expiracao'
  | 'fidelidade_gerenciar_eventos'
  | 'fidelidade_visualizar_parceiros'
  | 'fidelidade_gerenciar_parceiros';

export interface PerfilAcesso {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
  herdarDe?: string; // ID do perfil do qual herda permissões
  editavel: boolean; // Se pode ser editado (administrador é false)
  usuariosCount?: number;
}

// Educação a Distância - EAD
export interface CursoEAD {
  id: string;
  nome: string;
  descricao: string;
  cargaHoraria: number;
  disciplinaId?: string;
  escolaIds: string[];
  status: 'rascunho' | 'publicado' | 'arquivado';
  dataInicio?: string;
  dataFim?: string;
  plataforma?: string;
  linkPlataforma?: string;
  imagemUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModuloEAD {
  id: string;
  cursoId: string;
  nome: string;
  descricao: string;
  ordem: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AulaEAD {
  id: string;
  cursoId: string;
  moduloId?: string;
  titulo: string;
  descricao: string;
  tipo: 'video' | 'texto' | 'pdf' | 'link' | 'quiz';
  conteudo: string; // URL do vídeo, link, ou conteúdo texto
  duracao?: number; // em minutos
  ordem: number;
  obrigatoria: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MatriculaEAD {
  id: string;
  cursoId: string;
  estudanteId: string;
  escolaId: string;
  dataMatricula: string;
  status: 'ativa' | 'concluida' | 'cancelada' | 'trancada';
  progresso: number; // 0-100
  dataConclusao?: string;
  notaFinal?: number;
  certificadoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProgressoAulaEAD {
  id: string;
  matriculaEADId: string;
  aulaId: string;
  concluida: boolean;
  dataInicio?: string;
  dataConclusao?: string;
  tempoGasto?: number; // em minutos
  createdAt?: Date;
  updatedAt?: Date;
}

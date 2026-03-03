
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
  ativo: boolean;
  mustResetPassword?: boolean;
}

export type Permissao = 
  | 'gerenciar_usuarios'
  | 'gerenciar_perfis'
  | 'configuracoes_sistema'
  | 'gerenciar_escolas'
  | 'gerenciar_turmas'
  | 'gerenciar_disciplinas'
  | 'gerenciar_professores'
  | 'gerenciar_alunos'
  | 'gerenciar_matriculas'
  | 'gerenciar_vagas'
  | 'gerar_horarios'
  | 'visualizar_horarios'
  | 'gerenciar_academico'
  | 'registrar_frequencia'
  | 'visualizar_frequencia'
  | 'registrar_notas'
  | 'visualizar_notas'
  | 'acessar_relatorios'
  | 'gerenciar_cursos_ead'
  | 'gerenciar_modulos_ead'
  | 'gerenciar_aulas_ead'
  | 'gerenciar_matriculas_ead'
  | 'acessar_relatorios_ead'
  | 'gerenciar_fidelidade'
  | 'gerenciar_eventos';

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

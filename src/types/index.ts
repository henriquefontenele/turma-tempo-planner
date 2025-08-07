
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
  escolaId?: string;
  ativo: boolean;
}

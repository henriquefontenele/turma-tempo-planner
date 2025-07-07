
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
  horasMatutino: number;
  horasVespertino: number;
  horasNoturno: number;
  diasIndisponiveis: string[];
}

export interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: 'matutino' | 'vespertino' | 'noturno';
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
  matutino: ConfiguracaoTurno;
  vespertino: ConfiguracaoTurno;
  noturno: ConfiguracaoTurno;
}

export interface HorarioGerado {
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
  estudanteId: string;
  escolaId: string;
  turmaId: string;
  dataMatricula: string;
  status: 'ativa' | 'cancelada' | 'transferida';
  observacoes?: string;
}

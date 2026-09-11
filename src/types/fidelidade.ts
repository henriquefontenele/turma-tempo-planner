export interface UsuarioFidelidade {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  estudanteIds: string[]; // IDs dos filhos matriculados
  saldoPontos: number;
  pontosTotaisAcumulados: number;
  dataCadastro: string;
  ativo: boolean;
}

export interface TransacaoPontos {
  id: string;
  usuarioId: string;
  tipo: 'credito' | 'debito';
  quantidade: number;
  descricao: string;
  categoria: 'participacao' | 'indicacao' | 'pontualidade' | 'resgate' | 'bonus' | 'expiracao' | 'outro';
  referenciaId?: string; // ID do resgate ou evento relacionado
  criadoPor: string; // ID do admin que criou
  dataCriacao: string;
}

export interface ConfiguracaoFidelidade {
  id: string;
  validadePontosMeses: number; // 0 = sem expiração
  diasAlertaExpiracao: number; // dias antes de expirar para alertar (ex: 30)
  expiracoesAtivadas: boolean;
  ultimaVerificacaoExpiracao?: string; // ISO date da última verificação automática
}

export interface Recompensa {
  id: string;
  nome: string;
  descricao: string;
  pontosNecessarios: number;
  categoria: 'desconto' | 'material' | 'servico' | 'brinde' | 'outro';
  imagemUrl?: string;
  /** Limite global de usos (0 = ilimitado). */
  quantidadeDisponivel: number;
  /**
   * Limite opcional por usuário (0 ou ausente = sem teto por pessoa).
   * Ex.: 2 = cada usuário só pode resgatar 2 vouchers desta recompensa.
   */
  limitePorUsuario?: number;
  ativa: boolean;
  dataCriacao: string;
  /** Obrigatório — escola também é cadastrada como parceiro. */
  parceiroId: string;
  parceiroNome: string;
}

export interface PedidoResgate {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  recompensaId: string;
  recompensaNome: string;
  pontosUtilizados: number;
  status: 'pendente' | 'aprovado' | 'entregue' | 'cancelado';
  observacoes?: string;
  dataPedido: string;
  dataProcessamento?: string;
  processadoPor?: string;
  voucherCodigo?: string;
  parceiroId: string;
  parceiroNome: string;
}

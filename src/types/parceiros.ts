export interface Parceiro {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email: string;
  endereco: string;
  descricao: string;
  logoUrl?: string;
  ativo: boolean;
  dataCadastro: string;
}

export interface Voucher {
  id: string;
  codigo: string; // ex: PRM-A8C4-X2B9
  pedidoResgateId: string;
  usuarioId: string;
  usuarioNome: string;
  parceiroId: string;
  parceiroNome: string;
  recompensaId: string;
  recompensaNome: string;
  recompensaDescricao: string;
  pontosUtilizados: number;
  status: 'ativo' | 'utilizado' | 'expirado' | 'cancelado';
  dataCriacao: string;
  dataUtilizacao?: string;
}

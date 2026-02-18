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
  categoria: 'participacao' | 'indicacao' | 'pontualidade' | 'resgate' | 'bonus' | 'outro';
  referenciaId?: string; // ID do resgate ou evento relacionado
  criadoPor: string; // ID do admin que criou
  dataCriacao: string;
}

export interface Recompensa {
  id: string;
  nome: string;
  descricao: string;
  pontosNecessarios: number;
  categoria: 'desconto' | 'material' | 'servico' | 'brinde' | 'outro';
  imagemUrl?: string;
  quantidadeDisponivel: number;
  ativa: boolean;
  dataCriacao: string;
  parceiroId?: string; // ID do parceiro comercial (se for oferta de parceiro)
  parceiroNome?: string;
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
  voucherCodigo?: string; // código do voucher gerado (se for parceiro)
  parceiroId?: string;
  parceiroNome?: string;
}

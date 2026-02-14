export interface Evento {
  id: string;
  nome: string;
  data: string;
  local: string;
  pontosCreditar: number;
  qrCodeData: string; // dados codificados no QR
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  criadoPor: string;
  dataCriacao: string;
  descricao?: string;
}

export interface CheckinEvento {
  id: string;
  eventoId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  pontosCreditar: number;
  dataCheckin: string;
}

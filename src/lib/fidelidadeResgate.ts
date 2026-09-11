import type { PedidoResgate, Recompensa } from '@/types/fidelidade';

export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PRM-${block()}-${block()}`;
}

/** Conta resgates válidos (não cancelados) de uma recompensa. */
export function contarResgatesRecompensa(
  pedidos: Pick<PedidoResgate, 'recompensaId' | 'status'>[],
  recompensaId: string
): number {
  return pedidos.filter((p) => p.recompensaId === recompensaId && p.status !== 'cancelado').length;
}

/** Conta resgates válidos de uma recompensa por um usuário. */
export function contarResgatesUsuario(
  pedidos: Pick<PedidoResgate, 'recompensaId' | 'usuarioId' | 'status'>[],
  recompensaId: string,
  usuarioId: string
): number {
  return pedidos.filter(
    (p) => p.recompensaId === recompensaId && p.usuarioId === usuarioId && p.status !== 'cancelado'
  ).length;
}

export function podeResgatarRecompensa(
  recompensa: Recompensa,
  usuarioId: string,
  pedidos: PedidoResgate[],
  saldoPontos: number
): { ok: true } | { ok: false; motivo: string } {
  if (!recompensa.ativa) {
    return { ok: false, motivo: 'Esta recompensa não está ativa.' };
  }
  if (!recompensa.parceiroId) {
    return { ok: false, motivo: 'Recompensa sem parceiro vinculado.' };
  }
  if (saldoPontos < recompensa.pontosNecessarios) {
    return { ok: false, motivo: 'Pontos insuficientes.' };
  }
  if (recompensa.quantidadeDisponivel > 0) {
    const usados = contarResgatesRecompensa(pedidos, recompensa.id);
    if (usados >= recompensa.quantidadeDisponivel) {
      return { ok: false, motivo: 'Sem estoque no momento.' };
    }
  }
  const limiteUser = recompensa.limitePorUsuario ?? 0;
  if (limiteUser > 0) {
    const doUsuario = contarResgatesUsuario(pedidos, recompensa.id, usuarioId);
    if (doUsuario >= limiteUser) {
      return { ok: false, motivo: `Limite de ${limiteUser} resgate(s) por usuário atingido.` };
    }
  }
  return { ok: true };
}

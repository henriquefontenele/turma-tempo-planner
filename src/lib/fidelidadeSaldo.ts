import type { TransacaoPontos } from '@/types/fidelidade';

/** Saldo derivado do extrato (fonte de verdade do programa). */
export function calcularSaldoDeTransacoes(
  transacoes: Pick<TransacaoPontos, 'usuarioId' | 'tipo' | 'quantidade'>[],
  usuarioId: string
): { saldoPontos: number; pontosTotaisAcumulados: number } {
  let saldoPontos = 0;
  let pontosTotaisAcumulados = 0;
  for (const t of transacoes) {
    if (t.usuarioId !== usuarioId) continue;
    if (t.tipo === 'credito') {
      saldoPontos += t.quantidade;
      pontosTotaisAcumulados += t.quantidade;
    } else {
      saldoPontos -= t.quantidade;
    }
  }
  return {
    saldoPontos: Math.max(0, saldoPontos),
    pontosTotaisAcumulados,
  };
}

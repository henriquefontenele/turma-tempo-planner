import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Escola, Rede } from '@/types';
import { MODULOS } from '@/config/modulos';

/**
 * Módulos "vendíveis" na tela de instalação — exclui qualquer módulo marcado
 * como órfão (`ocultoNoMenu`) no catálogo, já que ligar/desligar algo que
 * nenhuma tela usa não tem efeito visível nenhum hoje.
 */
export const MODULOS_INSTALAVEIS = MODULOS.filter((m) => !m.ocultoNoMenu);

/** Liga/desliga um módulo no nível da rede — o teto do que qualquer escola dela pode ter. */
export async function alternarModuloDaRede(rede: Rede, moduloId: string, habilitar: boolean): Promise<void> {
  const atuais = rede.modulosHabilitados || [];
  const novaLista = habilitar
    ? Array.from(new Set([...atuais, moduloId]))
    : atuais.filter((id) => id !== moduloId);
  await updateDoc(doc(db, 'redes', rede.id), { modulosHabilitados: novaLista });
}

/**
 * Liga/desliga um módulo no nível de uma escola específica. A escola nunca
 * habilita algo que a rede não habilitou (regra de herança confirmada na
 * análise) — a UI já deve impedir isso, mas a função também não deixa passar.
 * Se a escola ainda não tem lista própria, ela nasce como cópia do que a rede
 * libera, e o toggle atual é aplicado sobre essa cópia.
 */
export async function alternarModuloDaEscola(
  escola: Escola,
  moduloId: string,
  habilitar: boolean,
  modulosDaRede: string[]
): Promise<void> {
  if (habilitar && !modulosDaRede.includes(moduloId)) return;
  const base = escola.modulosHabilitados ?? modulosDaRede;
  const novaLista = habilitar
    ? Array.from(new Set([...base, moduloId]))
    : base.filter((id) => id !== moduloId);
  await updateDoc(doc(db, 'escolas', escola.id), { modulosHabilitados: novaLista });
}

/** Remove a lista própria da escola — ela volta a herdar 100% da rede. */
export async function restaurarHerancaDaRede(escolaId: string): Promise<void> {
  await updateDoc(doc(db, 'escolas', escolaId), { modulosHabilitados: deleteField() });
}

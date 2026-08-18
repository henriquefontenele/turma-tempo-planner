import { addDoc, arrayRemove, arrayUnion, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Escola } from '@/types';
import { MODULO_IDS_VISIVEIS_COM_PERMISSAO } from '@/config/modulos';

/**
 * Sentinela usado nos formulários de escola para representar "crie uma rede
 * exclusiva para esta escola" — não pode ser string vazia porque o componente
 * Select não aceita SelectItem com value="".
 */
export const REDE_NOVA_SENTINELA = '__nova__';

/**
 * Cria uma rede "solo" para uma escola avulsa — toda escola vive dentro de uma
 * rede, mesmo que seja uma rede de uma escola só (decisão confirmada na análise:
 * https://claude.ai/code/artifact/4346d7db-6e4c-49f8-9a7d-41ee8f5b4240).
 *
 * Nasce com todos os módulos habilitados, preservando o comportamento atual
 * (tudo liberado) até o operador do sistema decidir restringir algo.
 */
export async function criarRedeSolo(escola: Pick<Escola, 'id' | 'nome'>): Promise<string> {
  const redeRef = await addDoc(collection(db, 'redes'), {
    nome: escola.nome,
    escolaIds: [escola.id],
    modulosHabilitados: MODULO_IDS_VISIVEIS_COM_PERMISSAO,
  });
  return redeRef.id;
}

/**
 * Resolve o ID de rede a usar para uma escola: se o usuário escolheu uma rede
 * existente, retorna o ID dela; se escolheu "nova rede própria" (ou nada),
 * cria uma rede solo e retorna o ID recém-criado.
 */
export async function resolverRedeId(
  redeIdSelecionado: string | undefined,
  escola: Pick<Escola, 'id' | 'nome'>
): Promise<string> {
  if (redeIdSelecionado && redeIdSelecionado !== REDE_NOVA_SENTINELA) {
    return redeIdSelecionado;
  }
  return criarRedeSolo(escola);
}

/** Move uma escola de uma rede para outra, mantendo escolaIds das duas redes consistentes. */
export async function moverEscolaDeRede(
  escolaId: string,
  redeAntigaId: string | undefined,
  redeNovaId: string
): Promise<void> {
  if (redeAntigaId === redeNovaId) return;
  if (redeAntigaId) {
    await updateDoc(doc(db, 'redes', redeAntigaId), { escolaIds: arrayRemove(escolaId) });
  }
  await updateDoc(doc(db, 'redes', redeNovaId), { escolaIds: arrayUnion(escolaId) });
}

/**
 * Backfill: cria uma rede solo para cada escola existente que ainda não tem
 * `redeId` (documentos gravados antes desta mudança de modelo). Retorna quantas
 * escolas foram migradas.
 */
export async function migrarEscolasSemRede(escolas: Escola[]): Promise<number> {
  const semRede = escolas.filter((e) => !e.redeId);
  for (const escola of semRede) {
    const redeId = await criarRedeSolo(escola);
    await updateDoc(doc(db, 'escolas', escola.id), { redeId });
  }
  return semRede.length;
}

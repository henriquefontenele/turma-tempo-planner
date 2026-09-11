import { useEffect, useState, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/Login';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Coins, Gift, History, Store, Clock, CheckCircle, XCircle, Copy, Ticket } from 'lucide-react';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate } from '@/types/fidelidade';
import { calcularSaldoDeTransacoes } from '@/lib/fidelidadeSaldo';
import { generateVoucherCode, podeResgatarRecompensa } from '@/lib/fidelidadeResgate';

// Portal do responsável: resgate imediato gera voucher + débito no extrato.
// O parceiro (escola ou loja) valida o código em /parceiro.
export default function MeusPontos() {
  const { user, loading } = useAuth();
  const [fidUsuario, setFidUsuario] = useState<UsuarioFidelidade | null | undefined>(undefined);
  const [transacoes, setTransacoes] = useState<TransacaoPontos[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResgate[]>([]);
  const [resgatando, setResgatando] = useState<string | null>(null);
  const [ultimoCodigo, setUltimoCodigo] = useState<string | null>(null);

  const saldo = useMemo(
    () => (user ? calcularSaldoDeTransacoes(transacoes, user.uid) : { saldoPontos: 0, pontosTotaisAcumulados: 0 }),
    [transacoes, user]
  );

  useEffect(() => {
    if (!user) {
      setFidUsuario(undefined);
      return;
    }

    const unsubUsuario = onSnapshot(doc(db, 'fidelidade_usuarios', user.uid), (snap) => {
      setFidUsuario(snap.exists() ? ({ id: snap.id, ...snap.data() } as UsuarioFidelidade) : null);
    });

    const unsubTransacoes = onSnapshot(
      query(collection(db, 'fidelidade_transacoes'), where('usuarioId', '==', user.uid)),
      (snap) => {
        const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TransacaoPontos));
        itens.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        setTransacoes(itens);
      }
    );

    const unsubRecompensas = onSnapshot(collection(db, 'fidelidade_recompensas'), (snap) => {
      setRecompensas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recompensa)));
    });

    const unsubPedidos = onSnapshot(
      query(collection(db, 'fidelidade_pedidos'), where('usuarioId', '==', user.uid)),
      (snap) => {
        const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PedidoResgate));
        itens.sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime());
        setPedidos(itens);
      }
    );

    return () => {
      unsubUsuario();
      unsubTransacoes();
      unsubRecompensas();
      unsubPedidos();
    };
  }, [user]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: 'Código do voucher copiado.' });
  };

  const handleResgatar = async (recompensa: Recompensa) => {
    if (!user || !fidUsuario) return;

    const check = podeResgatarRecompensa(recompensa, user.uid, pedidos, saldo.saldoPontos);
    if (!check.ok) {
      toast({ title: 'Não foi possível resgatar', description: check.motivo, variant: 'destructive' });
      return;
    }

    const pedidoId = crypto.randomUUID();
    const codigo = generateVoucherCode();
    const agora = new Date().toISOString();

    setResgatando(recompensa.id);
    try {
      await setDoc(doc(db, 'fidelidade_pedidos', pedidoId), {
        usuarioId: user.uid,
        usuarioNome: fidUsuario.nome,
        recompensaId: recompensa.id,
        recompensaNome: recompensa.nome,
        pontosUtilizados: recompensa.pontosNecessarios,
        status: 'aprovado',
        dataPedido: agora,
        dataProcessamento: agora,
        processadoPor: 'auto',
        voucherCodigo: codigo,
        parceiroId: recompensa.parceiroId,
        parceiroNome: recompensa.parceiroNome,
      });

      await setDoc(doc(db, 'fidelidade_transacoes', `resgate_${pedidoId}`), {
        usuarioId: user.uid,
        tipo: 'debito',
        quantidade: recompensa.pontosNecessarios,
        descricao: `Resgate: ${recompensa.nome}`,
        categoria: 'resgate',
        referenciaId: pedidoId,
        criadoPor: user.uid,
        dataCriacao: agora,
      });

      await setDoc(doc(db, 'fidelidade_vouchers', `voucher_${pedidoId}`), {
        codigo,
        pedidoResgateId: pedidoId,
        usuarioId: user.uid,
        usuarioNome: fidUsuario.nome,
        parceiroId: recompensa.parceiroId,
        parceiroNome: recompensa.parceiroNome,
        recompensaId: recompensa.id,
        recompensaNome: recompensa.nome,
        recompensaDescricao: recompensa.descricao || '',
        pontosUtilizados: recompensa.pontosNecessarios,
        status: 'ativo',
        dataCriacao: agora,
      });

      setUltimoCodigo(codigo);
      toast({
        title: 'Voucher gerado!',
        description: `Código ${codigo}. Apresente ao parceiro para validação.`,
      });
    } catch (e) {
      console.error('Erro ao resgatar:', e);
      toast({ title: 'Erro', description: 'Não foi possível concluir o resgate. Tente novamente.', variant: 'destructive' });
    } finally {
      setResgatando(null);
    }
  };

  const getStatusBadge = (status: PedidoResgate['status']) => {
    const config = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      aprovado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Resgatado' },
      entregue: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Utilizado' },
      cancelado: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' },
    };
    const { color, icon: Icon, label } = config[status];
    return (
      <Badge className={`${color} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" /> {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (fidUsuario === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando seus pontos...</p>
      </div>
    );
  }

  if (fidUsuario === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-2">
            <Coins className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Você ainda não faz parte do Programa de Fidelidade.</p>
            <p className="text-sm text-muted-foreground">
              Fale com a secretaria da sua escola para ser cadastrado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recompensasAtivas = recompensas.filter((r) => r.ativa && r.parceiroId);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">🏆 Meus Pontos</h1>
          <p className="text-muted-foreground text-sm">Olá, {fidUsuario.nome}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo disponível</p>
              <p className="text-3xl font-bold text-green-600">{saldo.saldoPontos.toLocaleString()} pts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total já acumulado</p>
              <p className="text-3xl font-bold text-muted-foreground">{saldo.pontosTotaisAcumulados.toLocaleString()} pts</p>
            </CardContent>
          </Card>
        </div>

        {ultimoCodigo && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-2">
              <Ticket className="w-8 h-8 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Seu voucher</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-wider">{ultimoCodigo}</code>
                <Button size="icon" variant="ghost" onClick={() => copyCode(ultimoCodigo)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Apresente este código ao parceiro para validação.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Gift className="w-5 h-5" /> Trocar por voucher</CardTitle>
            <CardDescription>
              O resgate debita seus pontos na hora e gera um código. O parceiro valida o uso na loja/escola.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recompensasAtivas.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">Nenhuma recompensa disponível no momento.</p>
            ) : (
              recompensasAtivas.map((r) => {
                const check = podeResgatarRecompensa(r, user.uid, pedidos, saldo.saldoPontos);
                const limiteUser = r.limitePorUsuario ?? 0;
                return (
                  <Card key={r.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{r.nome}</CardTitle>
                      <CardDescription>
                        {r.descricao || 'Sem descrição'}
                        <Badge variant="outline" className="ml-2 text-xs">
                          <Store className="w-3 h-3 mr-1" />{r.parceiroNome}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-lg font-bold text-primary">
                        <Coins className="w-5 h-5" /> {r.pontosNecessarios.toLocaleString()} pts
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {r.quantidadeDisponivel === 0 ? 'ilimitado' : r.quantidadeDisponivel}
                        {limiteUser > 0 ? ` · Máx. ${limiteUser} por usuário` : ''}
                      </p>
                      <Button
                        className="w-full"
                        disabled={!check.ok || resgatando === r.id}
                        onClick={() => handleResgatar(r)}
                      >
                        {!check.ok ? check.motivo : resgatando === r.id ? 'Gerando...' : 'Resgatar voucher'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Ticket className="w-5 h-5" /> Meus vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Você ainda não resgatou nenhum voucher.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.dataPedido).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {p.recompensaNome}
                        {p.parceiroNome && (
                          <span className="block text-xs text-muted-foreground">{p.parceiroNome}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.voucherCodigo ? (
                          <div className="flex items-center gap-1">
                            <code className="font-mono text-xs font-bold">{p.voucherCodigo}</code>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(p.voucherCodigo!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{p.pontosUtilizados} pts</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><History className="w-5 h-5" /> Extrato</CardTitle>
          </CardHeader>
          <CardContent>
            {transacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma movimentação ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{new Date(t.dataCriacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{t.descricao}</TableCell>
                      <TableCell className={`text-right font-bold ${t.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.tipo === 'credito' ? '+' : '-'}{t.quantidade}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

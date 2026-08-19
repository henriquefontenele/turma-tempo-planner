import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/Login';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Coins, Gift, History, Store, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate } from '@/types/fidelidade';

// Portal do próprio responsável — visualização de saldo/extrato e pedido de
// resgate de recompensas. Antes desta tela não existia NENHUM caminho, em
// lugar nenhum do app, para o usuário do programa de fidelidade ver os
// próprios pontos ou trocar por recompensa (o admin só conseguia aprovar
// pedidos que já existissem, mas nada os criava). O pedido criado aqui não
// debita pontos na hora — o débito só acontece quando o staff aprova, ver
// FidelidadeTab.tsx -> handleProcessarPedido e a regra de fidelidade_pedidos
// em firestore.rules.
export default function MeusPontos() {
  const { user, loading } = useAuth();
  const [fidUsuario, setFidUsuario] = useState<UsuarioFidelidade | null | undefined>(undefined);
  const [transacoes, setTransacoes] = useState<TransacaoPontos[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResgate[]>([]);
  const [resgatando, setResgatando] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFidUsuario(undefined);
      return;
    }

    // Documento próprio: id = uid da conta (ver FidelidadeTab.tsx -> handleAddUsuario)
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

  const handleResgatar = async (recompensa: Recompensa) => {
    if (!user || !fidUsuario) return;
    if (fidUsuario.saldoPontos < recompensa.pontosNecessarios) {
      toast({ title: 'Saldo insuficiente', description: 'Você não tem pontos suficientes para essa recompensa.', variant: 'destructive' });
      return;
    }
    if (recompensa.quantidadeDisponivel > 0) {
      const jaResgatados = pedidos.filter(
        (p) => p.recompensaId === recompensa.id && p.status !== 'cancelado'
      ).length;
      if (jaResgatados >= recompensa.quantidadeDisponivel) {
        toast({ title: 'Indisponível', description: 'Essa recompensa está sem estoque no momento.', variant: 'destructive' });
        return;
      }
    }

    setResgatando(recompensa.id);
    try {
      await addDoc(collection(db, 'fidelidade_pedidos'), {
        usuarioId: user.uid,
        usuarioNome: fidUsuario.nome,
        recompensaId: recompensa.id,
        recompensaNome: recompensa.nome,
        pontosUtilizados: recompensa.pontosNecessarios,
        status: 'pendente',
        dataPedido: new Date().toISOString(),
        // Firestore rejeita `undefined` como valor de campo — só inclui
        // parceiroId/parceiroNome quando a recompensa realmente tem parceiro.
        ...(recompensa.parceiroId ? { parceiroId: recompensa.parceiroId, parceiroNome: recompensa.parceiroNome || '' } : {}),
      });
      toast({ title: 'Pedido enviado!', description: `Seu pedido de "${recompensa.nome}" foi enviado e está aguardando aprovação.` });
    } catch (e) {
      console.error('Erro ao pedir resgate:', e);
      toast({ title: 'Erro', description: 'Não foi possível enviar o pedido. Tente novamente.', variant: 'destructive' });
    } finally {
      setResgatando(null);
    }
  };

  const getStatusBadge = (status: PedidoResgate['status']) => {
    const config = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Aguardando aprovação' },
      aprovado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Aprovado' },
      entregue: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Entregue' },
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
              <p className="text-3xl font-bold text-green-600">{fidUsuario.saldoPontos.toLocaleString()} pts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total já acumulado</p>
              <p className="text-3xl font-bold text-muted-foreground">{fidUsuario.pontosTotaisAcumulados.toLocaleString()} pts</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Gift className="w-5 h-5" /> Trocar por recompensa</CardTitle>
            <CardDescription>Escolha uma recompensa e envie o pedido — a escola confirma a entrega.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recompensas.filter((r) => r.ativa).length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">Nenhuma recompensa disponível no momento.</p>
            ) : (
              recompensas.filter((r) => r.ativa).map((r) => {
                const semEstoque = r.quantidadeDisponivel > 0 &&
                  pedidos.filter((p) => p.recompensaId === r.id && p.status !== 'cancelado').length >= r.quantidadeDisponivel;
                const semSaldo = fidUsuario.saldoPontos < r.pontosNecessarios;
                return (
                  <Card key={r.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{r.nome}</CardTitle>
                      <CardDescription>
                        {r.descricao || 'Sem descrição'}
                        {r.parceiroNome && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Store className="w-3 h-3 mr-1" />{r.parceiroNome}
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-lg font-bold text-primary">
                        <Coins className="w-5 h-5" /> {r.pontosNecessarios.toLocaleString()} pts
                      </div>
                      <Button
                        className="w-full"
                        disabled={semSaldo || semEstoque || resgatando === r.id}
                        onClick={() => handleResgatar(r)}
                      >
                        {semEstoque ? 'Sem estoque' : semSaldo ? 'Pontos insuficientes' : resgatando === r.id ? 'Enviando...' : 'Resgatar'}
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
            <CardTitle className="flex items-center gap-2 text-lg"><Gift className="w-5 h-5" /> Meus pedidos de resgate</CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Você ainda não pediu nenhuma recompensa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.dataPedido).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{p.recompensaNome}</TableCell>
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

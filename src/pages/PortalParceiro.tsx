import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/Login';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Gift, Ticket, Plus, Store, CheckCircle, Search } from 'lucide-react';
import type { Parceiro, Voucher } from '@/types/parceiros';
import type { Recompensa } from '@/types/fidelidade';

export default function PortalParceiro() {
  const { user, loading } = useAuth();
  const [parceiro, setParceiro] = useState<Parceiro | null | undefined>(undefined);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [buscaCodigo, setBuscaCodigo] = useState('');
  const [limitandoPorUsuario, setLimitandoPorUsuario] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    pontosNecessarios: 0,
    categoria: 'desconto' as Recompensa['categoria'],
    quantidadeDisponivel: 0,
    limitePorUsuario: 2,
  });

  useEffect(() => {
    if (!user) {
      setParceiro(undefined);
      return;
    }

    const unsubParceiro = onSnapshot(
      query(collection(db, 'fidelidade_parceiros'), where('userId', '==', user.uid)),
      (snap) => {
        if (snap.empty) {
          setParceiro(null);
          return;
        }
        const d = snap.docs[0];
        setParceiro({ id: d.id, ...d.data() } as Parceiro);
      }
    );

    return () => unsubParceiro();
  }, [user]);

  useEffect(() => {
    if (!parceiro?.id) {
      setRecompensas([]);
      setVouchers([]);
      return;
    }

    const unsubRec = onSnapshot(
      query(collection(db, 'fidelidade_recompensas'), where('parceiroId', '==', parceiro.id)),
      (snap) => {
        setRecompensas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recompensa)));
      }
    );

    const unsubVouchers = onSnapshot(
      query(collection(db, 'fidelidade_vouchers'), where('parceiroId', '==', parceiro.id)),
      (snap) => {
        const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Voucher));
        itens.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        setVouchers(itens);
      }
    );

    return () => {
      unsubRec();
      unsubVouchers();
    };
  }, [parceiro?.id]);

  const vouchersFiltrados = useMemo(() => {
    const q = buscaCodigo.trim().toUpperCase();
    if (!q) return vouchers;
    return vouchers.filter((v) => v.codigo.toUpperCase().includes(q));
  }, [vouchers, buscaCodigo]);

  const resetForm = () => {
    setForm({
      nome: '',
      descricao: '',
      pontosNecessarios: 0,
      categoria: 'desconto',
      quantidadeDisponivel: 0,
      limitePorUsuario: 2,
    });
    setLimitandoPorUsuario(false);
  };

  const handleAddRecompensa = async () => {
    if (!parceiro) return;
    if (!form.nome || form.pontosNecessarios <= 0) {
      toast({ title: 'Erro', description: 'Nome e pontos são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (limitandoPorUsuario && form.limitePorUsuario <= 0) {
      toast({ title: 'Erro', description: 'Informe o limite por usuário.', variant: 'destructive' });
      return;
    }

    const id = crypto.randomUUID();
    await setDoc(doc(db, 'fidelidade_recompensas', id), {
      nome: form.nome,
      descricao: form.descricao,
      pontosNecessarios: form.pontosNecessarios,
      categoria: form.categoria,
      quantidadeDisponivel: form.quantidadeDisponivel,
      ...(limitandoPorUsuario ? { limitePorUsuario: form.limitePorUsuario } : { limitePorUsuario: 0 }),
      ativa: true,
      dataCriacao: new Date().toISOString(),
      parceiroId: parceiro.id,
      parceiroNome: parceiro.nome,
    });

    resetForm();
    setDialogOpen(false);
    toast({ title: 'Oferta cadastrada!' });
  };

  const handleToggleAtiva = async (r: Recompensa) => {
    await updateDoc(doc(db, 'fidelidade_recompensas', r.id), { ativa: !r.ativa });
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir esta oferta?')) return;
    await deleteDoc(doc(db, 'fidelidade_recompensas', id));
    toast({ title: 'Oferta excluída' });
  };

  const handleValidar = async (v: Voucher) => {
    if (v.status !== 'ativo') {
      toast({ title: 'Indisponível', description: `Este voucher está ${v.status}.`, variant: 'destructive' });
      return;
    }
    await updateDoc(doc(db, 'fidelidade_vouchers', v.id), {
      status: 'utilizado',
      dataUtilizacao: new Date().toISOString(),
    });
    toast({ title: 'Voucher validado!', description: `${v.codigo} marcado como utilizado.` });
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

  if (parceiro === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando portal...</p>
      </div>
    );
  }

  if (parceiro === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-2">
            <Store className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-medium">Sua conta ainda não está vinculada a um parceiro.</p>
            <p className="text-sm text-muted-foreground">
              Peça ao gestor para cadastrar o parceiro (escola ou loja) e vincular esta conta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portal do Parceiro</h1>
          <p className="text-muted-foreground text-sm">{parceiro.nome}</p>
        </div>

        <Tabs defaultValue="ofertas">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="ofertas" className="gap-2"><Gift className="w-4 h-4" /> Minhas ofertas</TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-2"><Ticket className="w-4 h-4" /> Validar voucher</TabsTrigger>
          </TabsList>

          <TabsContent value="ofertas" className="space-y-4 mt-4">
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Nova oferta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar oferta</DialogTitle>
                  <DialogDescription>Recompensa vinculada a {parceiro.nome}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div>
                    <Label>Pontos necessários *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pontosNecessarios || ''}
                      onChange={(e) => setForm({ ...form, pontosNecessarios: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Recompensa['categoria'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desconto">Desconto</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="brinde">Brinde</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Limite de uso (0 = ilimitado)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.quantidadeDisponivel}
                      onChange={(e) => setForm({ ...form, quantidadeDisponivel: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label>Limitar por usuário</Label>
                      <p className="text-xs text-muted-foreground">Opcional — teto de resgates por pessoa</p>
                    </div>
                    <Switch checked={limitandoPorUsuario} onCheckedChange={setLimitandoPorUsuario} />
                  </div>
                  {limitandoPorUsuario && (
                    <div>
                      <Label>Máximo por usuário *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.limitePorUsuario}
                        onChange={(e) => setForm({ ...form, limitePorUsuario: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddRecompensa}>Cadastrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 sm:grid-cols-2">
              {recompensas.length === 0 ? (
                <Card className="sm:col-span-2">
                  <CardContent className="pt-6 text-center text-muted-foreground">Nenhuma oferta cadastrada.</CardContent>
                </Card>
              ) : (
                recompensas.map((r) => (
                  <Card key={r.id} className={!r.ativa ? 'opacity-60' : ''}>
                    <CardHeader>
                      <div className="flex justify-between gap-2">
                        <CardTitle className="text-base">{r.nome}</CardTitle>
                        <Badge variant={r.ativa ? 'default' : 'secondary'}>{r.ativa ? 'Ativa' : 'Inativa'}</Badge>
                      </div>
                      <CardDescription>{r.descricao || 'Sem descrição'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="font-bold text-primary">{r.pontosNecessarios.toLocaleString()} pts</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {r.quantidadeDisponivel === 0 ? 'ilimitado' : r.quantidadeDisponivel}
                        {(r.limitePorUsuario ?? 0) > 0 ? ` · Máx. ${r.limitePorUsuario}/usuário` : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleToggleAtiva(r)}>
                          {r.ativa ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleExcluir(r.id)}>Excluir</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validar voucher</CardTitle>
                <CardDescription>Busque pelo código e marque como utilizado para evitar fraude ou duplicidade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 font-mono uppercase"
                    placeholder="PRM-XXXX-XXXX"
                    value={buscaCodigo}
                    onChange={(e) => setBuscaCodigo(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Oferta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchersFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum voucher encontrado</TableCell>
                      </TableRow>
                    ) : (
                      vouchersFiltrados.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell><code className="font-mono font-bold text-sm">{v.codigo}</code></TableCell>
                          <TableCell>{v.usuarioNome}</TableCell>
                          <TableCell>{v.recompensaNome}</TableCell>
                          <TableCell>
                            <Badge variant={v.status === 'ativo' ? 'default' : 'secondary'}>{v.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {v.status === 'ativo' ? (
                              <Button size="sm" onClick={() => handleValidar(v)}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Validar
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {v.dataUtilizacao ? new Date(v.dataUtilizacao).toLocaleString('pt-BR') : '—'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

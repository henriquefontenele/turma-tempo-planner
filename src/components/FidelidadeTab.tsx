import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Gift, Users, Award, History, CheckCircle, XCircle, Clock, Coins } from 'lucide-react';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate } from '@/types/fidelidade';
import type { Estudante } from '@/types';

interface FidelidadeTabProps {
  estudantes: Estudante[];
}

export default function FidelidadeTab({ estudantes }: FidelidadeTabProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  
  const { data: usuarios, addItem: addUsuario, updateItem: updateUsuario, deleteItem: deleteUsuario } = 
    useFirestoreCollection<UsuarioFidelidade>('fidelidade_usuarios');
  const { data: transacoes, addItem: addTransacao } = 
    useFirestoreCollection<TransacaoPontos>('fidelidade_transacoes');
  const { data: recompensas, addItem: addRecompensa, updateItem: updateRecompensa, deleteItem: deleteRecompensa } = 
    useFirestoreCollection<Recompensa>('fidelidade_recompensas');
  const { data: pedidos, addItem: addPedido, updateItem: updatePedido } = 
    useFirestoreCollection<PedidoResgate>('fidelidade_pedidos');

  const [activeTab, setActiveTab] = useState('usuarios');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creditarDialogOpen, setCreditarDialogOpen] = useState(false);
  const [recompensaDialogOpen, setRecompensaDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioFidelidade | null>(null);

  // Form states
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    estudanteIds: [] as string[]
  });

  const [creditoPontos, setCreditoPontos] = useState({
    usuarioId: '',
    quantidade: 0,
    descricao: '',
    categoria: 'participacao' as TransacaoPontos['categoria']
  });

  const [novaRecompensa, setNovaRecompensa] = useState({
    nome: '',
    descricao: '',
    pontosNecessarios: 0,
    categoria: 'desconto' as Recompensa['categoria'],
    quantidadeDisponivel: 0
  });

  const handleAddUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.email) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }

    await addUsuario({
      ...novoUsuario,
      saldoPontos: 0,
      pontosTotaisAcumulados: 0,
      dataCadastro: new Date().toISOString(),
      ativo: true
    });

    setNovoUsuario({ nome: '', email: '', telefone: '', cpf: '', estudanteIds: [] });
    setDialogOpen(false);
    toast({ title: 'Sucesso', description: 'Usuário cadastrado com sucesso!' });
  };

  const handleCreditarPontos = async () => {
    if (!creditoPontos.usuarioId || creditoPontos.quantidade <= 0) {
      toast({ title: 'Erro', description: 'Selecione um usuário e informe a quantidade de pontos', variant: 'destructive' });
      return;
    }

    const usuario = usuarios.find(u => u.id === creditoPontos.usuarioId);
    if (!usuario) return;

    // Adicionar transação
    await addTransacao({
      usuarioId: creditoPontos.usuarioId,
      tipo: 'credito',
      quantidade: creditoPontos.quantidade,
      descricao: creditoPontos.descricao,
      categoria: creditoPontos.categoria,
      criadoPor: userProfile?.id || '',
      dataCriacao: new Date().toISOString()
    });

    // Atualizar saldo do usuário
    await updateUsuario(creditoPontos.usuarioId, {
      saldoPontos: usuario.saldoPontos + creditoPontos.quantidade,
      pontosTotaisAcumulados: usuario.pontosTotaisAcumulados + creditoPontos.quantidade
    });

    setCreditoPontos({ usuarioId: '', quantidade: 0, descricao: '', categoria: 'participacao' });
    setCreditarDialogOpen(false);
    toast({ title: 'Sucesso', description: `${creditoPontos.quantidade} pontos creditados com sucesso!` });
  };

  const handleAddRecompensa = async () => {
    if (!novaRecompensa.nome || novaRecompensa.pontosNecessarios <= 0) {
      toast({ title: 'Erro', description: 'Nome e pontos necessários são obrigatórios', variant: 'destructive' });
      return;
    }

    await addRecompensa({
      ...novaRecompensa,
      ativa: true,
      dataCriacao: new Date().toISOString()
    });

    setNovaRecompensa({ nome: '', descricao: '', pontosNecessarios: 0, categoria: 'desconto', quantidadeDisponivel: 0 });
    setRecompensaDialogOpen(false);
    toast({ title: 'Sucesso', description: 'Recompensa cadastrada com sucesso!' });
  };

  const handleProcessarPedido = async (pedido: PedidoResgate, novoStatus: PedidoResgate['status']) => {
    const usuario = usuarios.find(u => u.id === pedido.usuarioId);
    
    if (novoStatus === 'cancelado' && usuario) {
      // Devolver pontos ao cancelar
      await updateUsuario(pedido.usuarioId, {
        saldoPontos: usuario.saldoPontos + pedido.pontosUtilizados
      });
      
      await addTransacao({
        usuarioId: pedido.usuarioId,
        tipo: 'credito',
        quantidade: pedido.pontosUtilizados,
        descricao: `Devolução - Resgate cancelado: ${pedido.recompensaNome}`,
        categoria: 'resgate',
        referenciaId: pedido.id,
        criadoPor: userProfile?.id || '',
        dataCriacao: new Date().toISOString()
      });
    }

    await updatePedido(pedido.id, {
      status: novoStatus,
      dataProcessamento: new Date().toISOString(),
      processadoPor: userProfile?.id
    });

    toast({ title: 'Sucesso', description: `Pedido ${novoStatus === 'aprovado' ? 'aprovado' : novoStatus === 'entregue' ? 'marcado como entregue' : 'cancelado'}!` });
  };

  const getStatusBadge = (status: PedidoResgate['status']) => {
    const config = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      aprovado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      entregue: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelado: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoriaLabel = (categoria: TransacaoPontos['categoria']) => {
    const labels = {
      participacao: 'Participação',
      indicacao: 'Indicação',
      pontualidade: 'Pontualidade',
      resgate: 'Resgate',
      bonus: 'Bônus',
      outro: 'Outro'
    };
    return labels[categoria];
  };

  // Estatísticas
  const totalUsuarios = usuarios.filter(u => u.ativo).length;
  const totalPontosDistribuidos = usuarios.reduce((acc, u) => acc + u.pontosTotaisAcumulados, 0);
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const recompensasAtivas = recompensas.filter(r => r.ativa).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏆 Programa de Fidelidade</h2>
          <p className="text-gray-600">Gerencie pontos, recompensas e resgates</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{totalUsuarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Coins className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pontos Distribuídos</p>
                <p className="text-2xl font-bold">{totalPontosDistribuidos.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resgates Pendentes</p>
                <p className="text-2xl font-bold">{pedidosPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recompensas Ativas</p>
                <p className="text-2xl font-bold">{recompensasAtivas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="recompensas" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger value="resgates" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Resgates
          </TabsTrigger>
          <TabsTrigger value="extrato" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Extrato
          </TabsTrigger>
        </TabsList>

        {/* Tab Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Usuário</DialogTitle>
                  <DialogDescription>Adicione um novo pai/responsável ao programa de fidelidade</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={novoUsuario.nome} 
                      onChange={e => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input 
                      type="email"
                      value={novoUsuario.email} 
                      onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input 
                      value={novoUsuario.telefone} 
                      onChange={e => setNovoUsuario({...novoUsuario, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input 
                      value={novoUsuario.cpf} 
                      onChange={e => setNovoUsuario({...novoUsuario, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Filhos Matriculados</Label>
                    <Select
                      value={novoUsuario.estudanteIds[0] || 'none'}
                      onValueChange={(value) => setNovoUsuario({
                        ...novoUsuario, 
                        estudanteIds: value === 'none' ? [] : [value]
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um estudante" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum selecionado</SelectItem>
                        {estudantes.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddUsuario}>Cadastrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={creditarDialogOpen} onOpenChange={setCreditarDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Coins className="w-4 h-4 mr-2" /> Creditar Pontos</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Creditar Pontos</DialogTitle>
                  <DialogDescription>Adicione pontos manualmente a um usuário</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Usuário *</Label>
                    <Select
                      value={creditoPontos.usuarioId || 'none'}
                      onValueChange={(value) => setCreditoPontos({
                        ...creditoPontos, 
                        usuarioId: value === 'none' ? '' : value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione um usuário</SelectItem>
                        {usuarios.filter(u => u.ativo).map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nome} ({u.saldoPontos} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade de Pontos *</Label>
                    <Input 
                      type="number"
                      min={1}
                      value={creditoPontos.quantidade || ''} 
                      onChange={e => setCreditoPontos({...creditoPontos, quantidade: parseInt(e.target.value) || 0})}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={creditoPontos.categoria}
                      onValueChange={(value) => setCreditoPontos({
                        ...creditoPontos, 
                        categoria: value as TransacaoPontos['categoria']
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="participacao">Participação em Evento</SelectItem>
                        <SelectItem value="indicacao">Indicação de Aluno</SelectItem>
                        <SelectItem value="pontualidade">Pontualidade no Pagamento</SelectItem>
                        <SelectItem value="bonus">Bônus Especial</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição *</Label>
                    <Textarea 
                      value={creditoPontos.descricao} 
                      onChange={e => setCreditoPontos({...creditoPontos, descricao: e.target.value})}
                      placeholder="Ex: Participação na reunião de pais de março/2024"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreditarDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreditarPontos}>Creditar Pontos</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Total Acumulado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nenhum usuário cadastrado no programa
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map(usuario => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.telefone || '-'}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {usuario.saldoPontos.toLocaleString()} pts
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {usuario.pontosTotaisAcumulados.toLocaleString()} pts
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Recompensas */}
        <TabsContent value="recompensas" className="space-y-4">
          <Dialog open={recompensaDialogOpen} onOpenChange={setRecompensaDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nova Recompensa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Recompensa</DialogTitle>
                <DialogDescription>Adicione uma nova recompensa ao catálogo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input 
                    value={novaRecompensa.nome} 
                    onChange={e => setNovaRecompensa({...novaRecompensa, nome: e.target.value})}
                    placeholder="Ex: 10% de desconto na mensalidade"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea 
                    value={novaRecompensa.descricao} 
                    onChange={e => setNovaRecompensa({...novaRecompensa, descricao: e.target.value})}
                    placeholder="Descrição detalhada da recompensa"
                  />
                </div>
                <div>
                  <Label>Pontos Necessários *</Label>
                  <Input 
                    type="number"
                    min={1}
                    value={novaRecompensa.pontosNecessarios || ''} 
                    onChange={e => setNovaRecompensa({...novaRecompensa, pontosNecessarios: parseInt(e.target.value) || 0})}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={novaRecompensa.categoria}
                    onValueChange={(value) => setNovaRecompensa({
                      ...novaRecompensa, 
                      categoria: value as Recompensa['categoria']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desconto">Desconto</SelectItem>
                      <SelectItem value="material">Material Escolar</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                      <SelectItem value="brinde">Brinde</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade Disponível (0 = ilimitado)</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={novaRecompensa.quantidadeDisponivel} 
                    onChange={e => setNovaRecompensa({...novaRecompensa, quantidadeDisponivel: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecompensaDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddRecompensa}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recompensas.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center text-gray-500">
                  Nenhuma recompensa cadastrada
                </CardContent>
              </Card>
            ) : (
              recompensas.map(recompensa => (
                <Card key={recompensa.id} className={!recompensa.ativa ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{recompensa.nome}</CardTitle>
                      <Badge variant={recompensa.ativa ? 'default' : 'secondary'}>
                        {recompensa.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <CardDescription>{recompensa.descricao || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-lg font-bold text-primary">
                        <Coins className="w-5 h-5" />
                        {recompensa.pontosNecessarios.toLocaleString()} pts
                      </div>
                      <div className="text-sm text-gray-500">
                        {recompensa.quantidadeDisponivel === 0 ? 'Ilimitado' : `${recompensa.quantidadeDisponivel} disponíveis`}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateRecompensa(recompensa.id, { ativa: !recompensa.ativa })}
                      >
                        {recompensa.ativa ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteRecompensa(recompensa.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab Resgates */}
        <TabsContent value="resgates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Resgate</CardTitle>
              <CardDescription>Gerencie os pedidos de resgate de recompensas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nenhum pedido de resgate
                      </TableCell>
                    </TableRow>
                  ) : (
                    pedidos
                      .sort((a, b) => new Date(b.dataPedido).getTime() - new Date(a.dataPedido).getTime())
                      .map(pedido => (
                        <TableRow key={pedido.id}>
                          <TableCell>
                            {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium">{pedido.usuarioNome}</TableCell>
                          <TableCell>{pedido.recompensaNome}</TableCell>
                          <TableCell className="text-right">{pedido.pontosUtilizados} pts</TableCell>
                          <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                          <TableCell>
                            {pedido.status === 'pendente' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleProcessarPedido(pedido, 'aprovado')}
                                >
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleProcessarPedido(pedido, 'cancelado')}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                            {pedido.status === 'aprovado' && (
                              <Button 
                                size="sm"
                                onClick={() => handleProcessarPedido(pedido, 'entregue')}
                              >
                                Marcar Entregue
                              </Button>
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

        {/* Tab Extrato */}
        <TabsContent value="extrato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de Transações</CardTitle>
              <CardDescription>Histórico completo de movimentações de pontos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nenhuma transação registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transacoes
                      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
                      .map(transacao => {
                        const usuario = usuarios.find(u => u.id === transacao.usuarioId);
                        return (
                          <TableRow key={transacao.id}>
                            <TableCell>
                              {new Date(transacao.dataCriacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="font-medium">{usuario?.nome || 'Usuário não encontrado'}</TableCell>
                            <TableCell>
                              <Badge variant={transacao.tipo === 'credito' ? 'default' : 'secondary'}>
                                {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getCategoriaLabel(transacao.categoria)}</TableCell>
                            <TableCell className="max-w-xs truncate">{transacao.descricao}</TableCell>
                            <TableCell className={`text-right font-bold ${transacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                              {transacao.tipo === 'credito' ? '+' : '-'}{transacao.quantidade}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

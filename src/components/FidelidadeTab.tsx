import { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useFirestoreCollection, useFirestoreDoc } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Gift, Users, Award, History, CheckCircle, XCircle, Clock, Coins, Store, Ticket, Settings, AlertTriangle, Timer, Search, Filter, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate, ConfiguracaoFidelidade } from '@/types/fidelidade';
import type { Parceiro, Voucher } from '@/types/parceiros';
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
  const { data: parceiros } = 
    useFirestoreCollection<Parceiro>('fidelidade_parceiros');
  const { addItem: addVoucher } = 
    useFirestoreCollection<Voucher>('fidelidade_vouchers');
  const { data: configFidelidade, updateData: setConfigFidelidade } = 
    useFirestoreDoc<ConfiguracaoFidelidade>('fidelidade_config', {
      id: 'config',
      validadePontosMeses: 12,
      diasAlertaExpiracao: 30,
      expiracoesAtivadas: false,
    });

  const [activeTab, setActiveTab] = useState('usuarios');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creditarDialogOpen, setCreditarDialogOpen] = useState(false);
  const [recompensaDialogOpen, setRecompensaDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioFidelidade | null>(null);

  // Extrato filters & pagination
  const [extratoFiltroTipo, setExtratoFiltroTipo] = useState<'todos' | 'credito' | 'debito'>('todos');
  const [extratoFiltroCategoria, setExtratoFiltroCategoria] = useState<string>('todas');
  const [extratoDataInicio, setExtratoDataInicio] = useState<Date | undefined>(undefined);
  const [extratoDataFim, setExtratoDataFim] = useState<Date | undefined>(undefined);
  const [extratoUsuarioFiltro, setExtratoUsuarioFiltro] = useState<string>('todos');
  const [extratoPagina, setExtratoPagina] = useState(1);
  const extratoPorPagina = 15;

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
    quantidadeDisponivel: 0,
    parceiroId: ''
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

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `PRM-${block()}-${block()}`;
  };

  const handleAddRecompensa = async () => {
    if (!novaRecompensa.nome || novaRecompensa.pontosNecessarios <= 0) {
      toast({ title: 'Erro', description: 'Nome e pontos necessários são obrigatórios', variant: 'destructive' });
      return;
    }

    const parceiro = novaRecompensa.parceiroId ? parceiros.find(p => p.id === novaRecompensa.parceiroId) : null;

    await addRecompensa({
      ...novaRecompensa,
      parceiroId: parceiro?.id,
      parceiroNome: parceiro?.nome,
      ativa: true,
      dataCriacao: new Date().toISOString()
    });

    setNovaRecompensa({ nome: '', descricao: '', pontosNecessarios: 0, categoria: 'desconto', quantidadeDisponivel: 0, parceiroId: '' });
    setRecompensaDialogOpen(false);
    toast({ title: 'Sucesso', description: 'Recompensa cadastrada com sucesso!' });
  };

  const handleProcessarPedido = async (pedido: PedidoResgate, novoStatus: PedidoResgate['status']) => {
    const usuario = usuarios.find(u => u.id === pedido.usuarioId);
    
    if (novoStatus === 'cancelado' && usuario) {
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

    // Gerar voucher ao aprovar resgate de parceiro
    let voucherCodigo: string | undefined;
    if (novoStatus === 'aprovado' && pedido.parceiroId) {
      voucherCodigo = generateVoucherCode();
      const recompensa = recompensas.find(r => r.id === pedido.recompensaId);
      await addVoucher({
        codigo: voucherCodigo,
        pedidoResgateId: pedido.id,
        usuarioId: pedido.usuarioId,
        usuarioNome: pedido.usuarioNome,
        parceiroId: pedido.parceiroId,
        parceiroNome: pedido.parceiroNome || '',
        recompensaId: pedido.recompensaId,
        recompensaNome: pedido.recompensaNome,
        recompensaDescricao: recompensa?.descricao || '',
        pontosUtilizados: pedido.pontosUtilizados,
        status: 'ativo',
        dataCriacao: new Date().toISOString()
      });
    }

    await updatePedido(pedido.id, {
      status: novoStatus,
      dataProcessamento: new Date().toISOString(),
      processadoPor: userProfile?.id,
      ...(voucherCodigo ? { voucherCodigo } : {})
    });

    toast({ 
      title: 'Sucesso', 
      description: novoStatus === 'aprovado' && voucherCodigo
        ? `Pedido aprovado! Voucher gerado: ${voucherCodigo}`
        : `Pedido ${novoStatus === 'aprovado' ? 'aprovado' : novoStatus === 'entregue' ? 'marcado como entregue' : 'cancelado'}!`
    });
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
      expiracao: 'Expiração',
      outro: 'Outro'
    };
    return labels[categoria];
  };

  // === Lógica de Expiração de Pontos ===
  const verificarExpiracaoPontos = useCallback(async () => {
    if (!configFidelidade.expiracoesAtivadas || configFidelidade.validadePontosMeses <= 0) return;

    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];

    // Evitar rodar mais de uma vez por dia
    if (configFidelidade.ultimaVerificacaoExpiracao?.startsWith(hoje)) return;

    const limiteExpiracao = new Date();
    limiteExpiracao.setMonth(limiteExpiracao.getMonth() - configFidelidade.validadePontosMeses);

    // Buscar transações de crédito que expiraram
    const transacoesCredito = transacoes.filter(t => 
      t.tipo === 'credito' && 
      t.categoria !== 'expiracao' &&
      new Date(t.dataCriacao) < limiteExpiracao
    );

    // Agrupar pontos expirados por usuário
    const pontosExpiradosPorUsuario: Record<string, number> = {};
    
    // Verificar quais créditos ainda não foram expirados (sem transação de expiração correspondente)
    for (const transacao of transacoesCredito) {
      const jaExpirado = transacoes.some(t => 
        t.tipo === 'debito' && 
        t.categoria === 'expiracao' && 
        t.referenciaId === transacao.id
      );
      if (!jaExpirado) {
        pontosExpiradosPorUsuario[transacao.usuarioId] = 
          (pontosExpiradosPorUsuario[transacao.usuarioId] || 0) + transacao.quantidade;
      }
    }

    // Processar expiração
    for (const [usuarioId, pontosExpirados] of Object.entries(pontosExpiradosPorUsuario)) {
      if (pontosExpirados <= 0) continue;
      
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (!usuario) continue;

      const pontosReaisExpirados = Math.min(pontosExpirados, usuario.saldoPontos);
      if (pontosReaisExpirados <= 0) continue;

      // Criar transação de débito
      await addTransacao({
        usuarioId,
        tipo: 'debito',
        quantidade: pontosReaisExpirados,
        descricao: `Pontos expirados (validade de ${configFidelidade.validadePontosMeses} meses)`,
        categoria: 'expiracao',
        referenciaId: `exp_${hoje}_${usuarioId}`,
        criadoPor: 'sistema',
        dataCriacao: agora.toISOString()
      });

      // Atualizar saldo
      await updateUsuario(usuarioId, {
        saldoPontos: usuario.saldoPontos - pontosReaisExpirados
      });
    }

    // Atualizar data da última verificação
    await setConfigFidelidade({
      ...configFidelidade,
      ultimaVerificacaoExpiracao: agora.toISOString()
    });

    const totalExpirados = Object.values(pontosExpiradosPorUsuario).reduce((a, b) => a + b, 0);
    if (totalExpirados > 0) {
      toast({ 
        title: 'Expiração de Pontos', 
        description: `${totalExpirados} pontos foram expirados automaticamente.`
      });
    }
  }, [configFidelidade, transacoes, usuarios, addTransacao, updateUsuario, setConfigFidelidade, toast]);

  // Rodar verificação de expiração ao carregar
  useEffect(() => {
    if (usuarios.length > 0 && transacoes.length >= 0 && configFidelidade.expiracoesAtivadas) {
      verificarExpiracaoPontos();
    }
  }, [usuarios.length, transacoes.length, configFidelidade.expiracoesAtivadas]);

  // Calcular pontos próximos de expirar (para alerta visual)
  const pontosProximosExpiracao = useCallback(() => {
    if (!configFidelidade.expiracoesAtivadas || configFidelidade.validadePontosMeses <= 0) return [];

    const alertaData = new Date();
    alertaData.setMonth(alertaData.getMonth() - configFidelidade.validadePontosMeses);
    alertaData.setDate(alertaData.getDate() + configFidelidade.diasAlertaExpiracao);

    const limiteExpiracao = new Date();
    limiteExpiracao.setMonth(limiteExpiracao.getMonth() - configFidelidade.validadePontosMeses);

    const alertas: { usuarioId: string; usuarioNome: string; pontosAExpirar: number; dataExpiracao: Date }[] = [];

    // Transações de crédito que vão expirar nos próximos X dias
    const transacoesEmRisco = transacoes.filter(t =>
      t.tipo === 'credito' &&
      t.categoria !== 'expiracao' &&
      new Date(t.dataCriacao) < alertaData &&
      new Date(t.dataCriacao) >= limiteExpiracao
    );

    const porUsuario: Record<string, { pontos: number; dataExpiracao: Date }> = {};
    for (const t of transacoesEmRisco) {
      const jaExpirado = transacoes.some(tx => 
        tx.tipo === 'debito' && tx.categoria === 'expiracao' && tx.referenciaId === t.id
      );
      if (jaExpirado) continue;

      const dataExp = new Date(t.dataCriacao);
      dataExp.setMonth(dataExp.getMonth() + configFidelidade.validadePontosMeses);

      if (!porUsuario[t.usuarioId]) {
        porUsuario[t.usuarioId] = { pontos: 0, dataExpiracao: dataExp };
      }
      porUsuario[t.usuarioId].pontos += t.quantidade;
      if (dataExp < porUsuario[t.usuarioId].dataExpiracao) {
        porUsuario[t.usuarioId].dataExpiracao = dataExp;
      }
    }

    for (const [usuarioId, info] of Object.entries(porUsuario)) {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (usuario && info.pontos > 0) {
        alertas.push({
          usuarioId,
          usuarioNome: usuario.nome,
          pontosAExpirar: info.pontos,
          dataExpiracao: info.dataExpiracao
        });
      }
    }

    return alertas;
  }, [configFidelidade, transacoes, usuarios]);

  const alertasExpiracao = pontosProximosExpiracao();

  // Handler para salvar configurações de fidelidade
  const handleSalvarConfigFidelidade = async () => {
    await setConfigFidelidade(configFidelidade);
    toast({ title: 'Sucesso', description: 'Configurações do programa de fidelidade salvas!' });
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

      {/* Alerta de Pontos a Expirar */}
      {alertasExpiracao.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Pontos próximos de expirar!</p>
                <ul className="mt-1 space-y-1">
                  {alertasExpiracao.map(a => (
                    <li key={a.usuarioId} className="text-sm text-yellow-700">
                      <strong>{a.usuarioNome}</strong>: {a.pontosAExpirar} pontos expiram em{' '}
                      {a.dataExpiracao.toLocaleDateString('pt-BR')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
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
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
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
                <div>
                  <Label>Parceiro Comercial (opcional)</Label>
                  <Select
                    value={novaRecompensa.parceiroId || 'none'}
                    onValueChange={(value) => setNovaRecompensa({
                      ...novaRecompensa,
                      parceiroId: value === 'none' ? '' : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum (recompensa da escola)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (recompensa da escola)</SelectItem>
                      {parceiros.filter(p => p.ativo).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <CardDescription>
                      {recompensa.descricao || 'Sem descrição'}
                      {recompensa.parceiroNome && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          <Store className="w-3 h-3 mr-1" />
                          {recompensa.parceiroNome}
                        </Badge>
                      )}
                    </CardDescription>
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
                    <TableHead>Voucher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
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
                          <TableCell>
                            {pedido.recompensaNome}
                            {pedido.parceiroNome && <Badge variant="outline" className="ml-1 text-xs"><Store className="w-3 h-3 mr-1" />{pedido.parceiroNome}</Badge>}
                          </TableCell>
                          <TableCell className="text-right">{pedido.pontosUtilizados} pts</TableCell>
                          <TableCell>
                            {pedido.voucherCodigo ? (
                              <code className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded">{pedido.voucherCodigo}</code>
                            ) : '-'}
                          </TableCell>
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

        {/* Tab Extrato Detalhado */}
        <TabsContent value="extrato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Extrato Detalhado de Transações
              </CardTitle>
              <CardDescription>Histórico completo com filtros e paginação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg border bg-muted/30">
                <div>
                  <Label className="text-xs mb-1 block">Usuário</Label>
                  <Select value={extratoUsuarioFiltro} onValueChange={(v) => { setExtratoUsuarioFiltro(v); setExtratoPagina(1); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os usuários</SelectItem>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Tipo</Label>
                  <Select value={extratoFiltroTipo} onValueChange={(v: 'todos' | 'credito' | 'debito') => { setExtratoFiltroTipo(v); setExtratoPagina(1); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="credito">Ganhos (Crédito)</SelectItem>
                      <SelectItem value="debito">Resgates/Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Categoria</Label>
                  <Select value={extratoFiltroCategoria} onValueChange={(v) => { setExtratoFiltroCategoria(v); setExtratoPagina(1); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="participacao">Participação</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="pontualidade">Pontualidade</SelectItem>
                      <SelectItem value="resgate">Resgate</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="expiracao">Expiração</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {extratoDataInicio ? format(extratoDataInicio, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={extratoDataInicio}
                        onSelect={(d) => { setExtratoDataInicio(d); setExtratoPagina(1); }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {extratoDataFim ? format(extratoDataFim, 'dd/MM/yyyy') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={extratoDataFim}
                        onSelect={(d) => { setExtratoDataFim(d); setExtratoPagina(1); }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Botão limpar filtros */}
              {(extratoFiltroTipo !== 'todos' || extratoFiltroCategoria !== 'todas' || extratoDataInicio || extratoDataFim || extratoUsuarioFiltro !== 'todos') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExtratoFiltroTipo('todos');
                    setExtratoFiltroCategoria('todas');
                    setExtratoDataInicio(undefined);
                    setExtratoDataFim(undefined);
                    setExtratoUsuarioFiltro('todos');
                    setExtratoPagina(1);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Limpar Filtros
                </Button>
              )}

              {/* Tabela com dados filtrados e paginados */}
              {(() => {
                let filtradas = [...transacoes];
                
                if (extratoUsuarioFiltro !== 'todos') {
                  filtradas = filtradas.filter(t => t.usuarioId === extratoUsuarioFiltro);
                }
                if (extratoFiltroTipo !== 'todos') {
                  filtradas = filtradas.filter(t => t.tipo === extratoFiltroTipo);
                }
                if (extratoFiltroCategoria !== 'todas') {
                  filtradas = filtradas.filter(t => t.categoria === extratoFiltroCategoria);
                }
                if (extratoDataInicio) {
                  const inicio = new Date(extratoDataInicio);
                  inicio.setHours(0, 0, 0, 0);
                  filtradas = filtradas.filter(t => new Date(t.dataCriacao) >= inicio);
                }
                if (extratoDataFim) {
                  const fim = new Date(extratoDataFim);
                  fim.setHours(23, 59, 59, 999);
                  filtradas = filtradas.filter(t => new Date(t.dataCriacao) <= fim);
                }

                filtradas.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

                const totalFiltradas = filtradas.length;
                const totalPaginas = Math.max(1, Math.ceil(totalFiltradas / extratoPorPagina));
                const paginaAtual = Math.min(extratoPagina, totalPaginas);
                const inicio = (paginaAtual - 1) * extratoPorPagina;
                const paginadas = filtradas.slice(inicio, inicio + extratoPorPagina);

                const totalCreditos = filtradas.filter(t => t.tipo === 'credito').reduce((s, t) => s + t.quantidade, 0);
                const totalDebitos = filtradas.filter(t => t.tipo === 'debito').reduce((s, t) => s + t.quantidade, 0);

                return (
                  <>
                    {/* Resumo */}
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{totalFiltradas} transações encontradas</span>
                      <span className="text-green-600 font-medium">+{totalCreditos.toLocaleString()} pts ganhos</span>
                      <span className="text-red-600 font-medium">-{totalDebitos.toLocaleString()} pts gastos</span>
                    </div>

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
                        {paginadas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              Nenhuma transação encontrada com os filtros selecionados
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginadas.map(transacao => {
                            const usuario = usuarios.find(u => u.id === transacao.usuarioId);
                            return (
                              <TableRow key={transacao.id}>
                                <TableCell className="whitespace-nowrap">
                                  {new Date(transacao.dataCriacao).toLocaleDateString('pt-BR')}
                                  <span className="block text-xs text-muted-foreground">
                                    {new Date(transacao.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
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

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground">
                          Página {paginaAtual} de {totalPaginas}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={paginaAtual <= 1}
                            onClick={() => setExtratoPagina(p => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                          </Button>
                          {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                            let pageNum: number;
                            if (totalPaginas <= 5) {
                              pageNum = i + 1;
                            } else if (paginaAtual <= 3) {
                              pageNum = i + 1;
                            } else if (paginaAtual >= totalPaginas - 2) {
                              pageNum = totalPaginas - 4 + i;
                            } else {
                              pageNum = paginaAtual - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === paginaAtual ? 'default' : 'outline'}
                                size="sm"
                                className="w-9"
                                onClick={() => setExtratoPagina(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={paginaAtual >= totalPaginas}
                            onClick={() => setExtratoPagina(p => Math.min(totalPaginas, p + 1))}
                          >
                            Próximo <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Regras de Expiração de Pontos
              </CardTitle>
              <CardDescription>
                Defina as regras de validade dos pontos para manter o programa sustentável
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="text-base font-medium">Ativar Expiração de Pontos</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, os pontos expiram após o período definido
                  </p>
                </div>
                <Switch
                  checked={configFidelidade.expiracoesAtivadas}
                  onCheckedChange={(checked) => setConfigFidelidade({
                    ...configFidelidade,
                    expiracoesAtivadas: checked
                  })}
                />
              </div>

              {configFidelidade.expiracoesAtivadas && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Validade dos Pontos (meses)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={configFidelidade.validadePontosMeses}
                        onChange={(e) => setConfigFidelidade({
                          ...configFidelidade,
                          validadePontosMeses: parseInt(e.target.value) || 12
                        })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pontos creditados há mais de {configFidelidade.validadePontosMeses} meses serão expirados
                      </p>
                    </div>
                    <div>
                      <Label>Alerta de Expiração (dias antes)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={configFidelidade.diasAlertaExpiracao}
                        onChange={(e) => setConfigFidelidade({
                          ...configFidelidade,
                          diasAlertaExpiracao: parseInt(e.target.value) || 30
                        })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Aviso visual será exibido {configFidelidade.diasAlertaExpiracao} dias antes da expiração
                      </p>
                    </div>
                  </div>

                  {configFidelidade.ultimaVerificacaoExpiracao && (
                    <p className="text-sm text-muted-foreground">
                      Última verificação automática:{' '}
                      {new Date(configFidelidade.ultimaVerificacaoExpiracao).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleSalvarConfigFidelidade}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Alertas atuais */}
          {alertasExpiracao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="w-5 h-5" />
                  Pontos Próximos de Expirar ({alertasExpiracao.length} usuários)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Pontos a Expirar</TableHead>
                      <TableHead>Data de Expiração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasExpiracao.map(a => (
                      <TableRow key={a.usuarioId}>
                        <TableCell className="font-medium">{a.usuarioNome}</TableCell>
                        <TableCell className="text-right font-bold text-yellow-600">
                          {a.pontosAExpirar} pts
                        </TableCell>
                        <TableCell>{a.dataExpiracao.toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

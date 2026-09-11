import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { useFirestoreCollection, useFirestoreSharedDoc } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Gift, Users, Award, History, CheckCircle, XCircle, Clock, Coins, Store, Ticket, Settings, AlertTriangle, Timer, Search, Filter, ChevronLeft, ChevronRight, CalendarIcon, BarChart3, UserPlus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate, ConfiguracaoFidelidade } from '@/types/fidelidade';
import type { Parceiro, Voucher } from '@/types/parceiros';
import type { Evento, CheckinEvento } from '@/types/eventos';
import type { UserProfile } from '@/types';
import { calcularSaldoDeTransacoes } from '@/lib/fidelidadeSaldo';
import FidelidadeDashboard from './FidelidadeDashboard';

export default function FidelidadeTab() {
  const { toast } = useToast();
  const { userProfile, hasPermissao } = useAuth();
  const podeVerDashboard = hasPermissao('fidelidade_visualizar_dashboard');
  const podeVerExtrato = hasPermissao('fidelidade_visualizar_extrato');
  const podeCreditarPontos = hasPermissao('fidelidade_creditar_pontos');
  const podeVerParticipantes = podeVerExtrato || podeCreditarPontos;
  const podeVerResgates =
    hasPermissao('fidelidade_visualizar_resgates') || hasPermissao('fidelidade_gerenciar_resgates');
  const podeGerenciarResgates = hasPermissao('fidelidade_gerenciar_resgates');
  const podeVerRecompensas =
    hasPermissao('fidelidade_visualizar_recompensas') || hasPermissao('fidelidade_gerenciar_recompensas');
  const podeGerenciarRecompensas = hasPermissao('fidelidade_gerenciar_recompensas');
  const podeVerHistorico = hasPermissao('fidelidade_visualizar_historico');
  const podeConfigurarExpiracao = hasPermissao('fidelidade_configurar_expiracao');

  const abasPermitidas = useMemo(() => {
    const abas: string[] = [];
    if (podeVerDashboard) abas.push('dashboard');
    if (podeVerParticipantes) abas.push('usuarios');
    if (podeVerRecompensas) abas.push('recompensas');
    if (podeVerResgates) abas.push('resgates');
    if (podeVerExtrato) abas.push('extrato');
    if (podeVerHistorico) abas.push('historico');
    if (podeConfigurarExpiracao) abas.push('configuracoes');
    return abas;
  }, [
    podeVerDashboard,
    podeVerParticipantes,
    podeVerRecompensas,
    podeVerResgates,
    podeVerExtrato,
    podeVerHistorico,
    podeConfigurarExpiracao,
  ]);
  
  const { data: usuarios, setItem: setUsuario, updateItem: updateUsuario } = 
    useFirestoreCollection<UsuarioFidelidade>('fidelidade_usuarios');
  const { data: transacoes, addItem: addTransacao } = 
    useFirestoreCollection<TransacaoPontos>('fidelidade_transacoes');
  const { data: recompensas, addItem: addRecompensa, updateItem: updateRecompensa, deleteItem: deleteRecompensa } = 
    useFirestoreCollection<Recompensa>('fidelidade_recompensas');
  const { data: pedidos, updateItem: updatePedido } = 
    useFirestoreCollection<PedidoResgate>('fidelidade_pedidos');
  const { data: parceiros } = 
    useFirestoreCollection<Parceiro>('fidelidade_parceiros');
  const { data: vouchers, addItem: addVoucher } = 
    useFirestoreCollection<Voucher>('fidelidade_vouchers');
  // Config compartilhada do programa (era gravada por conta de staff em
  // users/{uid}/fidelidade_config — cada staff tinha sua própria cópia
  // privada, então "quem edita a expiração global" nunca foi de fato
  // aplicável). Agora um doc único em configuracoes/fidelidade.
  const { data: configFidelidade, updateData: setConfigFidelidade } =
    useFirestoreSharedDoc<ConfiguracaoFidelidade>('configuracoes', 'fidelidade', {
      id: 'fidelidade',
      validadePontosMeses: 12,
      diasAlertaExpiracao: 30,
      expiracoesAtivadas: false,
    });
  // Mesmas coleções usadas por EventosTab / CheckinEvento
  const { data: eventosData } = useFirestoreCollection<Evento>('eventos');
  const { data: checkinsData } = useFirestoreCollection<CheckinEvento>('checkins-eventos');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [creditarDialogOpen, setCreditarDialogOpen] = useState(false);
  const [cadastrarDialogOpen, setCadastrarDialogOpen] = useState(false);
  const [recompensaDialogOpen, setRecompensaDialogOpen] = useState(false);
  const [contasSistema, setContasSistema] = useState<UserProfile[]>([]);
  const [contaSistemaId, setContaSistemaId] = useState('');
  const [novoParticipante, setNovoParticipante] = useState({ telefone: '', cpf: '' });
  const [reconciliando, setReconciliando] = useState(false);

  // Garante que a aba ativa seja uma permitida (ex.: perfil sem dashboard)
  useEffect(() => {
    if (abasPermitidas.length === 0) return;
    if (!abasPermitidas.includes(activeTab)) {
      setActiveTab(abasPermitidas[0]);
    }
  }, [abasPermitidas, activeTab]);

  // Extrato filters & pagination
  const [extratoFiltroTipo, setExtratoFiltroTipo] = useState<'todos' | 'credito' | 'debito'>('todos');
  const [extratoFiltroCategoria, setExtratoFiltroCategoria] = useState<string>('todas');
  const [extratoDataInicio, setExtratoDataInicio] = useState<Date | undefined>(undefined);
  const [extratoDataFim, setExtratoDataFim] = useState<Date | undefined>(undefined);
  const [extratoUsuarioFiltro, setExtratoUsuarioFiltro] = useState<string>('todos');
  const [extratoPagina, setExtratoPagina] = useState(1);
  const extratoPorPagina = 15;

  // Form states
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
    parceiroId: '',
    limitePorUsuario: 2,
  });
  const [limitandoPorUsuario, setLimitandoPorUsuario] = useState(false);
  const [historicoTipo, setHistoricoTipo] = useState<'pontos' | 'recompensas' | 'vouchers' | 'eventos'>('pontos');
  const [historicoBusca, setHistoricoBusca] = useState('');
  const [historicoParceiro, setHistoricoParceiro] = useState('todos');

  const handleCreditarPontos = async () => {
    if (!creditoPontos.usuarioId || creditoPontos.quantidade <= 0) {
      toast({ title: 'Erro', description: 'Selecione um usuário e informe a quantidade de pontos', variant: 'destructive' });
      return;
    }

    const usuario = usuarios.find(u => u.id === creditoPontos.usuarioId);
    if (!usuario) return;

    const saldoAtual = calcularSaldoDeTransacoes(transacoes, usuario.id);

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

    // Atualizar saldo em cache (espelha o extrato)
    await updateUsuario(creditoPontos.usuarioId, {
      saldoPontos: saldoAtual.saldoPontos + creditoPontos.quantidade,
      pontosTotaisAcumulados: saldoAtual.pontosTotaisAcumulados + creditoPontos.quantidade
    });

    setCreditoPontos({ usuarioId: '', quantidade: 0, descricao: '', categoria: 'participacao' });
    setCreditarDialogOpen(false);
    toast({ title: 'Sucesso', description: `${creditoPontos.quantidade} pontos creditados com sucesso!` });
  };

  const contasDisponiveisParaCadastro = useMemo(() => {
    const jaCadastrados = new Set(usuarios.map((u) => u.id));
    return contasSistema.filter((c) => c.ativo !== false && !jaCadastrados.has(c.id));
  }, [contasSistema, usuarios]);

  const carregarContasSistema = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
      setContasSistema(lista);
    } catch (e) {
      console.error('Erro ao carregar contas do sistema:', e);
      toast({ title: 'Erro', description: 'Não foi possível carregar as contas do sistema.', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    if (cadastrarDialogOpen) {
      void carregarContasSistema();
    }
  }, [cadastrarDialogOpen, carregarContasSistema]);

  const handleCadastrarParticipante = async () => {
    if (!contaSistemaId) {
      toast({ title: 'Erro', description: 'Selecione uma conta do sistema.', variant: 'destructive' });
      return;
    }
    const conta = contasSistema.find((c) => c.id === contaSistemaId);
    if (!conta) return;
    if (usuarios.some((u) => u.id === conta.id)) {
      toast({ title: 'Já cadastrado', description: 'Essa conta já participa do programa.', variant: 'destructive' });
      return;
    }

    try {
      // ID = uid da conta — exigido por /meus-pontos e pelo check-in
      await setUsuario(conta.id, {
        nome: conta.nome || conta.email,
        email: conta.email,
        telefone: novoParticipante.telefone,
        cpf: novoParticipante.cpf,
        estudanteIds: [],
        saldoPontos: 0,
        pontosTotaisAcumulados: 0,
        dataCadastro: new Date().toISOString(),
        ativo: true,
      });
      setCadastrarDialogOpen(false);
      setContaSistemaId('');
      setNovoParticipante({ telefone: '', cpf: '' });
      toast({ title: 'Sucesso', description: `${conta.nome || conta.email} foi cadastrado(a) no programa.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível cadastrar o participante.', variant: 'destructive' });
    }
  };

  const usuariosComDivergenciaSaldo = useMemo(() => {
    return usuarios.filter((u) => {
      const calc = calcularSaldoDeTransacoes(transacoes, u.id);
      return calc.saldoPontos !== (u.saldoPontos || 0) || calc.pontosTotaisAcumulados !== (u.pontosTotaisAcumulados || 0);
    });
  }, [usuarios, transacoes]);

  const handleReconciliarSaldos = async () => {
    if (!podeCreditarPontos) return;
    setReconciliando(true);
    try {
      let corrigidos = 0;
      for (const u of usuarios) {
        const calc = calcularSaldoDeTransacoes(transacoes, u.id);
        if (
          calc.saldoPontos !== (u.saldoPontos || 0) ||
          calc.pontosTotaisAcumulados !== (u.pontosTotaisAcumulados || 0)
        ) {
          await updateUsuario(u.id, {
            saldoPontos: calc.saldoPontos,
            pontosTotaisAcumulados: calc.pontosTotaisAcumulados,
          });
          corrigidos++;
        }
      }
      toast({
        title: 'Saldos reconciliados',
        description:
          corrigidos > 0
            ? `${corrigidos} participante(s) atualizado(s) a partir do extrato.`
            : 'Nenhuma divergência encontrada.',
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Falha ao reconciliar saldos.', variant: 'destructive' });
    } finally {
      setReconciliando(false);
    }
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
    if (!novaRecompensa.parceiroId) {
      toast({ title: 'Erro', description: 'Selecione um parceiro (a escola também deve ser cadastrada como parceiro).', variant: 'destructive' });
      return;
    }
    if (limitandoPorUsuario && novaRecompensa.limitePorUsuario <= 0) {
      toast({ title: 'Erro', description: 'Informe o limite por usuário ou desmarque a opção.', variant: 'destructive' });
      return;
    }

    const parceiro = parceiros.find(p => p.id === novaRecompensa.parceiroId);
    if (!parceiro) {
      toast({ title: 'Erro', description: 'Parceiro não encontrado.', variant: 'destructive' });
      return;
    }

    await addRecompensa({
      nome: novaRecompensa.nome,
      descricao: novaRecompensa.descricao,
      pontosNecessarios: novaRecompensa.pontosNecessarios,
      categoria: novaRecompensa.categoria,
      quantidadeDisponivel: novaRecompensa.quantidadeDisponivel,
      limitePorUsuario: limitandoPorUsuario ? novaRecompensa.limitePorUsuario : 0,
      parceiroId: parceiro.id,
      parceiroNome: parceiro.nome,
      ativa: true,
      dataCriacao: new Date().toISOString()
    });

    setNovaRecompensa({ nome: '', descricao: '', pontosNecessarios: 0, categoria: 'desconto', quantidadeDisponivel: 0, parceiroId: '', limitePorUsuario: 2 });
    setLimitandoPorUsuario(false);
    setRecompensaDialogOpen(false);
    toast({ title: 'Sucesso', description: 'Recompensa cadastrada com sucesso!' });
  };

  const handleProcessarPedido = async (pedido: PedidoResgate, novoStatus: PedidoResgate['status']) => {
    const usuario = usuarios.find(u => u.id === pedido.usuarioId);
    const saldoAtual = usuario
      ? calcularSaldoDeTransacoes(transacoes, pedido.usuarioId)
      : { saldoPontos: 0, pontosTotaisAcumulados: 0 };

    // O pedido é criado pelo próprio responsável (portal de fidelidade) sem
    // debitar pontos na hora — o débito só acontece aqui, na aprovação pelo
    // staff, que é o ponto de confiança real do fluxo (o cliente não tem
    // permissão pra alterar o próprio saldo diretamente, ver firestore.rules).
    // Por isso "cancelado" nunca precisa devolver pontos: como só se cancela
    // um pedido "pendente" (a UI não permite cancelar um já aprovado), nada
    // chegou a ser debitado ainda.
    if (novoStatus === 'aprovado') {
      if (!usuario || saldoAtual.saldoPontos < pedido.pontosUtilizados) {
        toast({
          title: 'Erro',
          description: 'O usuário não tem saldo suficiente para este resgate. O pedido não foi aprovado.',
          variant: 'destructive'
        });
        return;
      }
      await addTransacao({
        usuarioId: pedido.usuarioId,
        tipo: 'debito',
        quantidade: pedido.pontosUtilizados,
        descricao: `Resgate aprovado: ${pedido.recompensaNome}`,
        categoria: 'resgate',
        referenciaId: pedido.id,
        criadoPor: userProfile?.id || '',
        dataCriacao: new Date().toISOString()
      });
      await updateUsuario(pedido.usuarioId, {
        saldoPontos: saldoAtual.saldoPontos - pedido.pontosUtilizados,
        pontosTotaisAcumulados: saldoAtual.pontosTotaisAcumulados,
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
    if (!podeCreditarPontos) return;

    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];

    // Evitar rodar mais de uma vez por dia
    if (configFidelidade.ultimaVerificacaoExpiracao?.startsWith(hoje)) return;

    const limiteExpiracao = new Date();
    limiteExpiracao.setMonth(limiteExpiracao.getMonth() - configFidelidade.validadePontosMeses);

    // Créditos vencidos ainda sem débito de expiração ligado ao próprio id do crédito
    const transacoesCredito = transacoes.filter(t =>
      t.tipo === 'credito' &&
      t.categoria !== 'expiracao' &&
      new Date(t.dataCriacao) < limiteExpiracao
    );

    let totalExpirados = 0;
    const saldoAposDebito: Record<string, number> = {};

    for (const transacao of transacoesCredito) {
      const jaExpirado = transacoes.some(t =>
        t.tipo === 'debito' &&
        t.categoria === 'expiracao' &&
        t.referenciaId === transacao.id
      );
      if (jaExpirado) continue;

      const usuario = usuarios.find(u => u.id === transacao.usuarioId);
      if (!usuario) continue;

      if (saldoAposDebito[usuario.id] === undefined) {
        saldoAposDebito[usuario.id] = calcularSaldoDeTransacoes(transacoes, usuario.id).saldoPontos;
      }
      const pontosReaisExpirados = Math.min(transacao.quantidade, saldoAposDebito[usuario.id]);
      if (pontosReaisExpirados <= 0) continue;

      // Um débito por crédito, com referenciaId = id do crédito (evita reprocessar)
      await addTransacao({
        usuarioId: usuario.id,
        tipo: 'debito',
        quantidade: pontosReaisExpirados,
        descricao: `Pontos expirados (validade de ${configFidelidade.validadePontosMeses} meses)`,
        categoria: 'expiracao',
        referenciaId: transacao.id,
        criadoPor: 'sistema',
        dataCriacao: agora.toISOString()
      });

      saldoAposDebito[usuario.id] -= pontosReaisExpirados;
      totalExpirados += pontosReaisExpirados;

      await updateUsuario(usuario.id, {
        saldoPontos: saldoAposDebito[usuario.id],
      });
    }

    await setConfigFidelidade({
      ...configFidelidade,
      ultimaVerificacaoExpiracao: agora.toISOString()
    });

    if (totalExpirados > 0) {
      toast({
        title: 'Expiração de Pontos',
        description: `${totalExpirados} pontos foram expirados automaticamente.`
      });
    }
  }, [configFidelidade, transacoes, usuarios, addTransacao, updateUsuario, setConfigFidelidade, toast, podeCreditarPontos]);

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
  const totalPontosDistribuidos = usuarios.reduce((acc, u) => {
    return acc + calcularSaldoDeTransacoes(transacoes, u.id).pontosTotaisAcumulados;
  }, 0);
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const recompensasAtivas = recompensas.filter(r => r.ativa).length;

  if (abasPermitidas.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <p className="font-medium">Sem permissão para as seções do Programa de Fidelidade.</p>
          <p className="text-sm text-muted-foreground">
            Peça ao administrador para liberar as abas em Perfis de Acesso, ou use{' '}
            <a href="/meus-pontos" className="text-primary underline">Meus Pontos</a> para o portal do responsável.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏆 Programa de Fidelidade</h2>
          <p className="text-gray-600">Gerencie pontos, recompensas e resgates</p>
        </div>
      </div>

      {/* Cards de Estatísticas — só com permissão de dashboard */}
      {podeVerDashboard && (
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
      )}

      {/* Alerta de Pontos a Expirar */}
      {podeVerDashboard && alertasExpiracao.length > 0 && (
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
        <TabsList
          className="grid w-full max-w-5xl"
          style={{ gridTemplateColumns: `repeat(${abasPermitidas.length}, minmax(0, 1fr))` }}
        >
          {podeVerDashboard && (
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          )}
          {podeVerParticipantes && (
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participantes
            </TabsTrigger>
          )}
          {podeVerRecompensas && (
            <TabsTrigger value="recompensas" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Recompensas
            </TabsTrigger>
          )}
          {podeVerResgates && (
            <TabsTrigger value="resgates" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Resgates
            </TabsTrigger>
          )}
          {podeVerExtrato && (
            <TabsTrigger value="extrato" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Extrato
            </TabsTrigger>
          )}
          {podeVerHistorico && (
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          )}
          {podeConfigurarExpiracao && (
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Dashboard */}
        {podeVerDashboard && (
        <TabsContent value="dashboard">
          <FidelidadeDashboard
            usuarios={usuarios}
            transacoes={transacoes}
            recompensas={recompensas}
            pedidos={pedidos}
            eventos={eventosData}
            checkins={checkinsData}
          />
        </TabsContent>
        )}

        {/* Tab Participantes — cadastro (id = uid), crédito manual e conciliação */}
        {podeVerParticipantes && (
        <TabsContent value="usuarios" className="space-y-4">
          {usuariosComDivergenciaSaldo.length > 0 && podeCreditarPontos && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-900">
                    {usuariosComDivergenciaSaldo.length} participante(s) com saldo em cache diferente do extrato
                    (comum após check-in pelo próprio responsável).
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reconciliando}
                  onClick={handleReconciliarSaldos}
                  className="shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${reconciliando ? 'animate-spin' : ''}`} />
                  Reconciliar saldos
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            {podeCreditarPontos && (
              <>
                <Dialog open={cadastrarDialogOpen} onOpenChange={setCadastrarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><UserPlus className="w-4 h-4 mr-2" /> Cadastrar participante</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar no programa</DialogTitle>
                      <DialogDescription>
                        O participante usa a mesma conta do sistema. O documento é criado com o UID da conta
                        (necessário para /meus-pontos e check-in).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Conta do sistema *</Label>
                        <Select value={contaSistemaId || 'none'} onValueChange={(v) => setContaSistemaId(v === 'none' ? '' : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecione...</SelectItem>
                            {contasDisponiveisParaCadastro.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome} ({c.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {contasDisponiveisParaCadastro.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Nenhuma conta disponível — todas já estão no programa ou não há usuários ativos.
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={novoParticipante.telefone}
                          onChange={(e) => setNovoParticipante({ ...novoParticipante, telefone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label>CPF</Label>
                        <Input
                          value={novoParticipante.cpf}
                          onChange={(e) => setNovoParticipante({ ...novoParticipante, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCadastrarDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCadastrarParticipante}>Cadastrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={creditarDialogOpen} onOpenChange={setCreditarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Coins className="w-4 h-4 mr-2" /> Creditar Pontos</Button>
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
                                {u.nome} ({calcularSaldoDeTransacoes(transacoes, u.id).saldoPontos} pts)
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

                {usuariosComDivergenciaSaldo.length === 0 && (
                  <Button variant="ghost" size="sm" disabled={reconciliando} onClick={handleReconciliarSaldos}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${reconciliando ? 'animate-spin' : ''}`} />
                    Reconciliar saldos
                  </Button>
                )}
              </>
            )}
          </div>

          {!podeCreditarPontos && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Você pode consultar os participantes, mas não creditar pontos nem cadastrar novos
                (permissão fidelidade_creditar_pontos).
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Participantes do programa</CardTitle>
              <CardDescription>Saldo exibido é calculado a partir do extrato</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Total acumulado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        Nenhum participante cadastrado. Use &quot;Cadastrar participante&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => {
                      const calc = calcularSaldoDeTransacoes(transacoes, usuario.id);
                      const divergente =
                        calc.saldoPontos !== (usuario.saldoPontos || 0) ||
                        calc.pontosTotaisAcumulados !== (usuario.pontosTotaisAcumulados || 0);
                      return (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.nome}
                            {divergente && (
                              <Badge variant="outline" className="ml-2 text-amber-700 border-amber-400">cache ≠ extrato</Badge>
                            )}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {calc.saldoPontos.toLocaleString()} pts
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {calc.pontosTotaisAcumulados.toLocaleString()} pts
                          </TableCell>
                          <TableCell>
                            <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {podeCreditarPontos ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateUsuario(usuario.id, { ativo: !usuario.ativo })}
                              >
                                {usuario.ativo ? 'Desativar' : 'Ativar'}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
        )}

        {/* Tab Recompensas */}
        {podeVerRecompensas && (
        <TabsContent value="recompensas" className="space-y-4">
          {podeGerenciarRecompensas && (
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
                  <Label>Limite de uso / estoque (0 = ilimitado)</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={novaRecompensa.quantidadeDisponivel} 
                    onChange={e => setNovaRecompensa({...novaRecompensa, quantidadeDisponivel: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Limitar por usuário</Label>
                    <p className="text-xs text-muted-foreground">Opcional — máx. de vouchers por pessoa</p>
                  </div>
                  <Switch checked={limitandoPorUsuario} onCheckedChange={setLimitandoPorUsuario} />
                </div>
                {limitandoPorUsuario && (
                  <div>
                    <Label>Máximo por usuário *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={novaRecompensa.limitePorUsuario}
                      onChange={e => setNovaRecompensa({...novaRecompensa, limitePorUsuario: parseInt(e.target.value) || 0})}
                    />
                  </div>
                )}
                <div>
                  <Label>Parceiro *</Label>
                  <Select
                    value={novaRecompensa.parceiroId || 'none'}
                    onValueChange={(value) => setNovaRecompensa({
                      ...novaRecompensa,
                      parceiroId: value === 'none' ? '' : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parceiro (escola ou loja)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione...</SelectItem>
                      {parceiros.filter(p => p.ativo).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {parceiros.filter(p => p.ativo).length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Cadastre a escola/loja em Parceiros antes.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecompensaDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddRecompensa}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

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
                        {(recompensa.limitePorUsuario ?? 0) > 0 ? ` · máx. ${recompensa.limitePorUsuario}/usuário` : ''}
                      </div>
                    </div>
                    {podeGerenciarRecompensas && (
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
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        )}

        {/* Tab Resgates */}
        {podeVerResgates && (
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
                            {!podeGerenciarResgates ? (
                              <span className="text-xs text-muted-foreground">Somente leitura</span>
                            ) : (
                              <>
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
                              </>
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
        )}

        {/* Tab Extrato: saldo por usuário + extrato detalhado unificados */}
        {podeVerExtrato && (
        <TabsContent value="extrato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Saldo por Usuário
              </CardTitle>
              <CardDescription>Saldo atual e total acumulado de cada participante do programa</CardDescription>
            </CardHeader>
            <CardContent>
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
                    usuarios.map(usuario => {
                      const calc = calcularSaldoDeTransacoes(transacoes, usuario.id);
                      return (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>{usuario.telefone || '-'}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {calc.saldoPontos.toLocaleString()} pts
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {calc.pontosTotaisAcumulados.toLocaleString()} pts
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
        )}

        {/* Tab Histórico — busca consolidada */}
        {podeVerHistorico && (
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Histórico e busca</CardTitle>
              <CardDescription>Pontos, recompensas, vouchers e eventos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Tipo</Label>
                  <Select value={historicoTipo} onValueChange={(v) => setHistoricoTipo(v as typeof historicoTipo)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontos">Pontos utilizados / movimentações</SelectItem>
                      <SelectItem value="recompensas">Recompensas cadastradas</SelectItem>
                      <SelectItem value="vouchers">Vouchers resgatados</SelectItem>
                      <SelectItem value="eventos">Eventos cadastrados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Busca</Label>
                  <Input
                    placeholder="Texto, código, nome..."
                    value={historicoBusca}
                    onChange={(e) => setHistoricoBusca(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Parceiro</Label>
                  <Select value={historicoParceiro} onValueChange={setHistoricoParceiro}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {parceiros.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {historicoTipo === 'pontos' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes
                      .filter((t) => {
                        const q = historicoBusca.trim().toLowerCase();
                        if (!q) return true;
                        const nome = usuarios.find((u) => u.id === t.usuarioId)?.nome || '';
                        return (
                          t.descricao?.toLowerCase().includes(q) ||
                          t.categoria?.toLowerCase().includes(q) ||
                          nome.toLowerCase().includes(q) ||
                          String(t.quantidade).includes(q)
                        );
                      })
                      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
                      .slice(0, 100)
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.dataCriacao).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{usuarios.find((u) => u.id === t.usuarioId)?.nome || t.usuarioId.slice(0, 8)}</TableCell>
                          <TableCell><Badge variant={t.tipo === 'credito' ? 'default' : 'secondary'}>{t.tipo}</Badge></TableCell>
                          <TableCell>{t.descricao}</TableCell>
                          <TableCell className={`text-right font-bold ${t.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.tipo === 'credito' ? '+' : '-'}{t.quantidade}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}

              {historicoTipo === 'recompensas' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Limite/usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recompensas
                      .filter((r) => {
                        if (historicoParceiro !== 'todos' && r.parceiroId !== historicoParceiro) return false;
                        const q = historicoBusca.trim().toLowerCase();
                        if (!q) return true;
                        return r.nome.toLowerCase().includes(q) || (r.parceiroNome || '').toLowerCase().includes(q);
                      })
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.nome}</TableCell>
                          <TableCell>{r.parceiroNome || '—'}</TableCell>
                          <TableCell>{r.pontosNecessarios}</TableCell>
                          <TableCell>{r.quantidadeDisponivel === 0 ? 'Ilimitado' : r.quantidadeDisponivel}</TableCell>
                          <TableCell>{(r.limitePorUsuario ?? 0) > 0 ? r.limitePorUsuario : '—'}</TableCell>
                          <TableCell><Badge variant={r.ativa ? 'default' : 'secondary'}>{r.ativa ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                          <TableCell>{r.dataCriacao ? new Date(r.dataCriacao).toLocaleDateString('pt-BR') : '—'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}

              {historicoTipo === 'vouchers' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Parceiro</TableHead>
                      <TableHead>Recompensa</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers
                      .filter((v) => {
                        if (historicoParceiro !== 'todos' && v.parceiroId !== historicoParceiro) return false;
                        const q = historicoBusca.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          v.codigo.toLowerCase().includes(q) ||
                          v.usuarioNome.toLowerCase().includes(q) ||
                          v.recompensaNome.toLowerCase().includes(q) ||
                          v.parceiroNome.toLowerCase().includes(q)
                        );
                      })
                      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
                      .map((v) => (
                        <TableRow key={v.id}>
                          <TableCell><code className="font-mono text-xs font-bold">{v.codigo}</code></TableCell>
                          <TableCell>{v.usuarioNome}</TableCell>
                          <TableCell>{v.parceiroNome}</TableCell>
                          <TableCell>{v.recompensaNome}</TableCell>
                          <TableCell>{v.pontosUtilizados}</TableCell>
                          <TableCell><Badge>{v.status}</Badge></TableCell>
                          <TableCell>{new Date(v.dataCriacao).toLocaleDateString('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}

              {historicoTipo === 'eventos' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-ins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventosData
                      .filter((ev) => {
                        const q = historicoBusca.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          ev.nome.toLowerCase().includes(q) ||
                          (ev.local || '').toLowerCase().includes(q) ||
                          ev.status.toLowerCase().includes(q)
                        );
                      })
                      .map((ev) => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium">{ev.nome}</TableCell>
                          <TableCell>{ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '—'}</TableCell>
                          <TableCell>{ev.local}</TableCell>
                          <TableCell>{ev.pontosCreditar}</TableCell>
                          <TableCell><Badge variant="outline">{ev.status}</Badge></TableCell>
                          <TableCell>{checkinsData.filter((c) => c.eventoId === ev.id).length}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Tab Configurações */}
        {podeConfigurarExpiracao && (
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
                  disabled={!podeConfigurarExpiracao}
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
                        disabled={!podeConfigurarExpiracao}
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
                        disabled={!podeConfigurarExpiracao}
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

              {podeConfigurarExpiracao && (
                <Button onClick={handleSalvarConfigFidelidade}>
                  Salvar Configurações
                </Button>
              )}
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
        )}
      </Tabs>
    </div>
  );
}

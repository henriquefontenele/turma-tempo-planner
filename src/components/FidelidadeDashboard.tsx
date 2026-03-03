import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Users, Coins, Gift, TrendingUp, CalendarCheck, Award } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UsuarioFidelidade, TransacaoPontos, Recompensa, PedidoResgate } from '@/types/fidelidade';
import type { Evento, CheckinEvento } from '@/types/eventos';

interface FidelidadeDashboardProps {
  usuarios: UsuarioFidelidade[];
  transacoes: TransacaoPontos[];
  recompensas: Recompensa[];
  pedidos: PedidoResgate[];
  eventos: Evento[];
  checkins: CheckinEvento[];
}

const COLORS = [
  'hsl(221, 83%, 53%)',   // blue
  'hsl(142, 71%, 45%)',   // green
  'hsl(262, 83%, 58%)',   // purple
  'hsl(24, 95%, 53%)',    // orange
  'hsl(340, 82%, 52%)',   // pink
];

export default function FidelidadeDashboard({
  usuarios,
  transacoes,
  recompensas,
  pedidos,
  eventos,
  checkins,
}: FidelidadeDashboardProps) {
  // KPIs
  const kpis = useMemo(() => {
    const ativos = usuarios.filter(u => u.ativo).length;
    const totalDistribuidos = transacoes
      .filter(t => t.tipo === 'credito')
      .reduce((s, t) => s + t.quantidade, 0);
    const totalResgatados = transacoes
      .filter(t => t.tipo === 'debito')
      .reduce((s, t) => s + t.quantidade, 0);
    const pedidosEntregues = pedidos.filter(p => p.status === 'aprovado' || p.status === 'entregue').length;
    const totalCheckins = checkins.length;

    return { ativos, totalDistribuidos, totalResgatados, pedidosEntregues, totalCheckins };
  }, [usuarios, transacoes, pedidos, checkins]);

  // Pontos distribuídos vs resgatados - últimos 6 meses
  const pontosChartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const label = format(date, 'MMM yy', { locale: ptBR });

      const distribuidos = transacoes
        .filter(t => t.tipo === 'credito' && isWithinInterval(parseISO(t.dataCriacao), { start, end }))
        .reduce((s, t) => s + t.quantidade, 0);

      const resgatados = transacoes
        .filter(t => t.tipo === 'debito' && isWithinInterval(parseISO(t.dataCriacao), { start, end }))
        .reduce((s, t) => s + t.quantidade, 0);

      months.push({ mes: label, distribuidos, resgatados });
    }
    return months;
  }, [transacoes]);

  // Top 5 recompensas mais resgatadas
  const topRecompensas = useMemo(() => {
    const counts: Record<string, { nome: string; count: number }> = {};
    pedidos
      .filter(p => p.status !== 'cancelado')
      .forEach(p => {
        if (!counts[p.recompensaId]) {
          counts[p.recompensaId] = { nome: p.recompensaNome, count: 0 };
        }
        counts[p.recompensaId].count++;
      });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [pedidos]);

  // Participação nos últimos eventos (até 8)
  const eventosChartData = useMemo(() => {
    const eventosFinalizados = eventos
      .filter(e => e.status === 'finalizado' || e.status === 'em_andamento')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8)
      .reverse();

    return eventosFinalizados.map(ev => ({
      nome: ev.nome.length > 18 ? ev.nome.substring(0, 18) + '…' : ev.nome,
      checkins: checkins.filter(c => c.eventoId === ev.id).length,
    }));
  }, [eventos, checkins]);

  const pontosChartConfig: ChartConfig = {
    distribuidos: { label: 'Distribuídos', color: 'hsl(142, 71%, 45%)' },
    resgatados: { label: 'Resgatados', color: 'hsl(340, 82%, 52%)' },
  };

  const eventosChartConfig: ChartConfig = {
    checkins: { label: 'Check-ins', color: 'hsl(221, 83%, 53%)' },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.ativos}</div>
            <p className="text-xs text-muted-foreground">de {usuarios.length} cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pontos Distribuídos</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.totalDistribuidos.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">total acumulado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pontos Resgatados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{kpis.totalResgatados.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalDistribuidos > 0 
                ? `${Math.round((kpis.totalResgatados / kpis.totalDistribuidos) * 100)}% de engajamento`
                : 'nenhum ponto distribuído'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resgates Aprovados</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pedidosEntregues}</div>
            <p className="text-xs text-muted-foreground">de {pedidos.length} pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-ins Eventos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCheckins}</div>
            <p className="text-xs text-muted-foreground">em {eventos.length} eventos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pontos Distribuídos vs Resgatados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pontos: Distribuídos vs Resgatados</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {pontosChartData.some(d => d.distribuidos > 0 || d.resgatados > 0) ? (
              <ChartContainer config={pontosChartConfig} className="h-[280px] w-full">
                <BarChart data={pontosChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="distribuidos" fill="var(--color-distribuidos)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resgatados" fill="var(--color-resgatados)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Nenhuma transação registrada nos últimos 6 meses
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participação nos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participação nos Eventos</CardTitle>
            <CardDescription>Check-ins nos últimos eventos</CardDescription>
          </CardHeader>
          <CardContent>
            {eventosChartData.length > 0 ? (
              <ChartContainer config={eventosChartConfig} className="h-[280px] w-full">
                <BarChart data={eventosChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="nome" className="text-xs" angle={-20} textAnchor="end" height={60} />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="checkins" fill="var(--color-checkins)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                Nenhum evento finalizado para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Recompensas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top 5 Recompensas Mais Resgatadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRecompensas.length > 0 ? (
            <div className="space-y-3">
              {topRecompensas.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Badge variant={i === 0 ? 'default' : 'secondary'} className="w-7 h-7 rounded-full flex items-center justify-center p-0 text-xs">
                    {i + 1}º
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.nome}</span>
                      <span className="text-sm text-muted-foreground">{r.count} resgates</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(r.count / topRecompensas[0].count) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhum resgate realizado ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Última atualização */}
      <div className="text-xs text-muted-foreground text-right">
        Dados atualizados em tempo real via Firestore
      </div>
    </div>
  );
}

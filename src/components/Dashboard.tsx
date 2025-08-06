import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  School, 
  Calendar, 
  UserCheck, 
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Escola, Turma, Disciplina, Professor, Estudante, Matricula, HorarioGerado, RegistroFrequencia, RegistroNota } from '@/types';

interface DashboardProps {
  escolas: Escola[];
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Professor[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  horariosGerados: HorarioGerado[];
  registrosFrequencia: RegistroFrequencia[];
  registrosNotas: RegistroNota[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({
  escolas,
  turmas,
  disciplinas,
  professores,
  estudantes,
  matriculas,
  horariosGerados,
  registrosFrequencia,
  registrosNotas,
  onNavigate
}: DashboardProps) {
  // Calcular estatísticas
  const stats = {
    escolas: escolas.length,
    turmas: turmas.length,
    disciplinas: disciplinas.length,
    professores: professores.length,
    estudantes: estudantes.length,
    matriculasAtivas: matriculas.filter(m => m.status === 'ativa').length,
    horariosGerados: horariosGerados.length,
    frequenciaMedia: registrosFrequencia.length > 0 
      ? Math.round((registrosFrequencia.filter(r => r.status === 'presente').length / registrosFrequencia.length) * 100)
      : 0
  };

  // Gerar alertas
  const alerts = [];
  
  if (stats.escolas === 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Nenhuma escola cadastrada',
      description: 'Cadastre pelo menos uma escola para começar.',
      action: () => onNavigate('escolas')
    });
  }
  
  if (stats.disciplinas === 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Nenhuma disciplina cadastrada',
      description: 'Cadastre disciplinas para organizar o currículo.',
      action: () => onNavigate('disciplinas')
    });
  }
  
  if (stats.professores === 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Nenhum professor cadastrado',
      description: 'Cadastre professores para atribuir às disciplinas.',
      action: () => onNavigate('professores')
    });
  }
  
  if (stats.turmas === 0 && stats.escolas > 0 && stats.disciplinas > 0) {
    alerts.push({
      type: 'warning' as const,
      title: 'Nenhuma turma cadastrada',
      description: 'Crie turmas para organizar os estudantes.',
      action: () => onNavigate('turmas')
    });
  }
  
  if (stats.horariosGerados === 0 && stats.turmas > 0 && stats.professores > 0) {
    alerts.push({
      type: 'info' as const,
      title: 'Horários não gerados',
      description: 'Gere os horários das turmas para organizar as aulas.',
      action: () => onNavigate('gerador')
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'success' as const,
      title: 'Sistema configurado!',
      description: 'Todos os componentes básicos estão cadastrados. Continue gerenciando matrículas e horários.',
      action: null
    });
  }

  const statCards = [
    {
      title: 'Escolas',
      value: stats.escolas,
      description: 'Unidades educacionais',
      icon: School,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => onNavigate('escolas')
    },
    {
      title: 'Turmas',
      value: stats.turmas,
      description: 'Classes organizadas',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => onNavigate('turmas')
    },
    {
      title: 'Disciplinas',
      value: stats.disciplinas,
      description: 'Matérias do currículo',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => onNavigate('disciplinas')
    },
    {
      title: 'Professores',
      value: stats.professores,
      description: 'Educadores cadastrados',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => onNavigate('professores')
    },
    {
      title: 'Estudantes',
      value: stats.estudantes,
      description: 'Alunos no sistema',
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: () => onNavigate('alunos')
    },
    {
      title: 'Matrículas Ativas',
      value: stats.matriculasAtivas,
      description: 'Estudantes matriculados',
      icon: ClipboardList,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      action: () => onNavigate('matricula')
    },
    {
      title: 'Horários Gerados',
      value: stats.horariosGerados,
      description: 'Grades horárias criadas',
      icon: Calendar,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      action: () => onNavigate('horarios')
    },
    {
      title: 'Frequência Média',
      value: `${stats.frequenciaMedia}%`,
      description: 'Taxa de presença',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      action: () => onNavigate('academico')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral do sistema de gestão escolar</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Badge>
      </div>

      {/* Alertas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Alertas e Ações</h2>
        <div className="grid gap-4">
          {alerts.map((alert, index) => (
            <Alert key={index} className={`
              ${alert.type === 'success' ? 'border-green-200 bg-green-50' : ''}
              ${alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
              ${alert.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
            `}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  {alert.type === 'info' && <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />}
                  <div>
                    <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                    <AlertDescription className="text-sm">{alert.description}</AlertDescription>
                  </div>
                </div>
                {alert.action && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={alert.action}
                    className="ml-4 shrink-0"
                  >
                    Resolver
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Estatísticas do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={card.action}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </div>
                  <CardDescription className="text-xs text-gray-500">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={() => onNavigate('matricula')}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-sm">Nova Matrícula</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={() => onNavigate('gerador')}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-sm">Gerar Horários</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={() => onNavigate('academico')}
          >
            <UserCheck className="w-6 h-6" />
            <span className="text-sm">Registrar Frequência</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={() => onNavigate('relatorio')}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm">Ver Relatórios</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
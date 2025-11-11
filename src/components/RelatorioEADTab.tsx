import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Clock } from 'lucide-react';
import { MatriculaEAD, CursoEAD, Estudante, AulaEAD } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';

export function RelatorioEADTab() {
  const [selectedCurso, setSelectedCurso] = useState('all');

  const { data: matriculas } = useFirestoreCollection<MatriculaEAD>('matriculasEAD');
  const { data: cursos } = useFirestoreCollection<CursoEAD>('cursosEAD', false);
  const { data: estudantes } = useFirestoreCollection<Estudante>('estudantes');
  const { data: aulas } = useFirestoreCollection<AulaEAD>('aulasEAD', false);

  const filteredMatriculas = (selectedCurso && selectedCurso !== 'all')
    ? matriculas.filter(m => m.cursoId === selectedCurso)
    : matriculas;

  // Estatísticas gerais
  const stats = {
    totalCursos: cursos.length,
    cursosPublicados: cursos.filter(c => c.status === 'publicado').length,
    totalMatriculas: matriculas.length,
    matriculasAtivas: matriculas.filter(m => m.status === 'ativa').length,
    matriculasConcluidas: matriculas.filter(m => m.status === 'concluida').length,
    totalAulas: aulas.length,
    progressoMedio: matriculas.length > 0
      ? Math.round(matriculas.reduce((acc, m) => acc + m.progresso, 0) / matriculas.length)
      : 0,
  };

  // Estatísticas por curso
  const cursoStats = cursos.map(curso => {
    const matriculasDoCurso = matriculas.filter(m => m.cursoId === curso.id);
    const aulasDoCurso = aulas.filter(a => a.cursoId === curso.id);
    const progressoMedio = matriculasDoCurso.length > 0
      ? Math.round(matriculasDoCurso.reduce((acc, m) => acc + m.progresso, 0) / matriculasDoCurso.length)
      : 0;
    const taxaConclusao = matriculasDoCurso.length > 0
      ? Math.round((matriculasDoCurso.filter(m => m.status === 'concluida').length / matriculasDoCurso.length) * 100)
      : 0;

    return {
      curso,
      totalMatriculas: matriculasDoCurso.length,
      matriculasAtivas: matriculasDoCurso.filter(m => m.status === 'ativa').length,
      matriculasConcluidas: matriculasDoCurso.filter(m => m.status === 'concluida').length,
      totalAulas: aulasDoCurso.length,
      progressoMedio,
      taxaConclusao,
    };
  });

  // Ranking de alunos
  const alunosRanking = filteredMatriculas
    .filter(m => m.status === 'ativa' || m.status === 'concluida')
    .map(m => {
      const estudante = estudantes.find(e => e.id === m.estudanteId);
      const curso = cursos.find(c => c.id === m.cursoId);
      return {
        matricula: m,
        estudante,
        curso,
      };
    })
    .sort((a, b) => b.matricula.progresso - a.matricula.progresso);

  const statCards = [
    {
      title: 'Total de Cursos',
      value: stats.totalCursos,
      subtitle: `${stats.cursosPublicados} publicados`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total de Matrículas',
      value: stats.totalMatriculas,
      subtitle: `${stats.matriculasAtivas} ativas`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Matrículas Concluídas',
      value: stats.matriculasConcluidas,
      subtitle: 'Certificados emitidos',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Progresso Médio',
      value: `${stats.progressoMedio}%`,
      subtitle: 'Todos os cursos',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
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
                <p className="text-xs text-gray-500">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas por Curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas por Curso
          </CardTitle>
          <CardDescription>Desempenho e métricas de cada curso</CardDescription>
        </CardHeader>
        <CardContent>
          {cursoStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum curso cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Matrículas</TableHead>
                  <TableHead>Ativas</TableHead>
                  <TableHead>Concluídas</TableHead>
                  <TableHead>Aulas</TableHead>
                  <TableHead>Progresso Médio</TableHead>
                  <TableHead>Taxa de Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cursoStats.map((stat) => (
                  <TableRow key={stat.curso.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stat.curso.nome}</div>
                        <Badge variant="outline" className="mt-1">
                          {stat.curso.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{stat.totalMatriculas}</TableCell>
                    <TableCell>{stat.matriculasAtivas}</TableCell>
                    <TableCell>{stat.matriculasConcluidas}</TableCell>
                    <TableCell>{stat.totalAulas}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={stat.progressoMedio} className="w-20" />
                        <div className="text-xs text-gray-500">{stat.progressoMedio}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          stat.taxaConclusao >= 70 ? 'bg-green-500' :
                          stat.taxaConclusao >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }
                      >
                        {stat.taxaConclusao}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ranking de Alunos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Ranking de Alunos
              </CardTitle>
              <CardDescription>Alunos por progresso no curso</CardDescription>
            </div>
            <div className="w-64">
              <Label>Filtrar por Curso</Label>
              <Select value={selectedCurso || 'all'} onValueChange={setSelectedCurso}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alunosRanking.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma matrícula encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nota Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosRanking.slice(0, 20).map((item, index) => (
                  <TableRow key={item.matricula.id}>
                    <TableCell>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.estudante?.nome || '-'}</div>
                        <div className="text-sm text-gray-500">{item.estudante?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.curso?.nome || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={item.matricula.progresso} className="w-24" />
                        <div className="text-xs text-gray-500">{item.matricula.progresso}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.matricula.status === 'concluida' ? (
                        <Badge className="bg-blue-500">Concluída</Badge>
                      ) : (
                        <Badge className="bg-green-500">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.matricula.notaFinal !== undefined ? (
                        <Badge className={
                          item.matricula.notaFinal >= 7 ? 'bg-green-500' :
                          item.matricula.notaFinal >= 5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {item.matricula.notaFinal.toFixed(1)}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
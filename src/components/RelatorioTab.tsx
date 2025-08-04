import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Escola, Turma, Estudante, Matricula, Disciplina, Professor, RegistroFrequencia, RegistroNota } from '@/types';
import { Search, FileText, BarChart3 } from 'lucide-react';

interface RelatorioTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  disciplinas: Disciplina[];
  professores: Professor[];
  registrosFrequencia: RegistroFrequencia[];
  registrosNotas: RegistroNota[];
}

export function RelatorioTab({
  escolas,
  turmas,
  estudantes,
  matriculas,
  disciplinas,
  professores,
  registrosFrequencia,
  registrosNotas,
}: RelatorioTabProps) {
  const [filtros, setFiltros] = useState({
    escola: '',
    turma: '',
    disciplina: '',
    busca: '',
  });

  const turmasFiltradas = turmas.filter(
    (turma) => !filtros.escola || turma.escolaId === filtros.escola
  );

  const matriculasAtivas = matriculas.filter(
    (matricula) => matricula.status === 'ativa' && (!filtros.turma || matricula.turmaId === filtros.turma)
  );

  const estudantesDaTurma = estudantes.filter((estudante) =>
    matriculasAtivas.some((matricula) => matricula.estudanteId === estudante.id)
  );

  const disciplinasDaTurma = disciplinas.filter((disciplina) =>
    turmas
      .find((turma) => turma.id === filtros.turma)
      ?.disciplinas?.includes(disciplina.id)
  );

  const calcularResumoFrequencia = () => {
    const resumo = estudantesDaTurma.map((estudante) => {
      const registrosDoEstudante = registrosFrequencia.filter(
        (r) => r.estudanteId === estudante.id && 
        (!filtros.turma || r.turmaId === filtros.turma) &&
        (!filtros.disciplina || r.disciplinaId === filtros.disciplina)
      );

      const totalAulas = registrosDoEstudante.length;
      const presencas = registrosDoEstudante.filter((r) => r.status === 'presente').length;
      const percentualPresenca = totalAulas > 0 ? (presencas / totalAulas) * 100 : 0;

      return {
        estudante,
        totalAulas,
        presencas,
        faltas: totalAulas - presencas,
        percentualPresenca,
      };
    });

    return resumo.filter((item) => {
      if (filtros.busca) {
        return item.estudante.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      }
      return true;
    });
  };

  const calcularResumoNotas = () => {
    const resumo = estudantesDaTurma.map((estudante) => {
      const notasDoEstudante = registrosNotas.filter(
        (r) => r.estudanteId === estudante.id && 
        (!filtros.turma || r.turmaId === filtros.turma) &&
        (!filtros.disciplina || r.disciplinaId === filtros.disciplina)
      );

      // Agrupar notas por disciplina
      const notasPorDisciplina: { [key: string]: number[] } = {};
      notasDoEstudante.forEach((nota) => {
        if (!notasPorDisciplina[nota.disciplinaId]) {
          notasPorDisciplina[nota.disciplinaId] = [];
        }
        notasPorDisciplina[nota.disciplinaId].push(nota.valor);
      });

      // Calcular média por disciplina
      const mediasPorDisciplina = Object.entries(notasPorDisciplina).map(([disciplinaId, notas]) => {
        const media = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
        const disciplina = disciplinas.find(d => d.id === disciplinaId);
        return {
          disciplinaId,
          disciplinaNome: disciplina?.nome || 'Disciplina não encontrada',
          media,
          totalProvas: notas.length,
        };
      });

      // Calcular média geral
      const mediaGeral = mediasPorDisciplina.length > 0 
        ? mediasPorDisciplina.reduce((sum, item) => sum + item.media, 0) / mediasPorDisciplina.length 
        : 0;

      let situacao = 'Aprovado';
      if (mediaGeral < 5) situacao = 'Reprovado';
      else if (mediaGeral < 7) situacao = 'Em Recuperação';

      return {
        estudante,
        mediasPorDisciplina,
        mediaGeral,
        situacao,
        totalProvas: notasDoEstudante.length,
      };
    });

    return resumo.filter((item) => {
      if (filtros.busca) {
        return item.estudante.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      }
      return true;
    });
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 75) return <Badge className="bg-green-100 text-green-800">Adequada</Badge>;
    if (percentual >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítica</Badge>;
  };

  const getSituacaoBadge = (situacao: string) => {
    if (situacao === 'Aprovado') return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    if (situacao === 'Em Recuperação') return <Badge className="bg-yellow-100 text-yellow-800">Em Recuperação</Badge>;
    return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
  };

  const resumoFrequencia = calcularResumoFrequencia();
  const resumoNotas = calcularResumoNotas();

  // Estatísticas gerais
  const estatisticasFrequencia = {
    presencaMedia: resumoFrequencia.length > 0 
      ? resumoFrequencia.reduce((sum, item) => sum + item.percentualPresenca, 0) / resumoFrequencia.length 
      : 0,
    estudantesComFrequenciaAdequada: resumoFrequencia.filter(item => item.percentualPresenca >= 75).length,
    estudantesComFrequenciaCritica: resumoFrequencia.filter(item => item.percentualPresenca < 60).length,
  };

  const estatisticasNotas = {
    mediaGeral: resumoNotas.length > 0 
      ? resumoNotas.reduce((sum, item) => sum + item.mediaGeral, 0) / resumoNotas.length 
      : 0,
    aprovados: resumoNotas.filter(item => item.situacao === 'Aprovado').length,
    emRecuperacao: resumoNotas.filter(item => item.situacao === 'Em Recuperação').length,
    reprovados: resumoNotas.filter(item => item.situacao === 'Reprovado').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatórios Acadêmicos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Select value={filtros.escola} onValueChange={(value) => setFiltros({...filtros, escola: value, turma: ''})}>
              <SelectTrigger>
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todas as escolas</SelectItem>
                {escolas.map((escola) => (
                  <SelectItem key={escola.id} value={escola.id}>
                    {escola.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.turma} onValueChange={(value) => setFiltros({...filtros, turma: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todas as turmas</SelectItem>
                {turmasFiltradas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.disciplina} onValueChange={(value) => setFiltros({...filtros, disciplina: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todas as disciplinas</SelectItem>
                {disciplinasDaTurma.map((disciplina) => (
                  <SelectItem key={disciplina.id} value={disciplina.id}>
                    {disciplina.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar estudante..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatísticas de Frequência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Estatísticas de Frequência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {estatisticasFrequencia.presencaMedia.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Frequência Média</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {estatisticasFrequencia.estudantesComFrequenciaAdequada}
                    </div>
                    <div className="text-xs text-gray-600">Freq. Adequada (≥75%)</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {estatisticasFrequencia.estudantesComFrequenciaCritica}
                    </div>
                    <div className="text-xs text-gray-600">Freq. Crítica (&lt;60%)</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Estatísticas de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {estatisticasNotas.mediaGeral.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Média Geral</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {estatisticasNotas.aprovados}
                    </div>
                    <div className="text-xs text-gray-600">Aprovados</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {estatisticasNotas.emRecuperacao}
                    </div>
                    <div className="text-xs text-gray-600">Recuperação</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {estatisticasNotas.reprovados}
                    </div>
                    <div className="text-xs text-gray-600">Reprovados</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório de Frequência */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Frequência por Estudante</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudante</TableHead>
                <TableHead>Total de Aulas</TableHead>
                <TableHead>Presenças</TableHead>
                <TableHead>Faltas</TableHead>
                <TableHead>% Frequência</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoFrequencia.map((item) => (
                <TableRow key={item.estudante.id}>
                  <TableCell className="font-medium">{item.estudante.nome}</TableCell>
                  <TableCell>{item.totalAulas}</TableCell>
                  <TableCell className="text-green-600 font-medium">{item.presencas}</TableCell>
                  <TableCell className="text-red-600 font-medium">{item.faltas}</TableCell>
                  <TableCell className="font-bold">{item.percentualPresenca.toFixed(1)}%</TableCell>
                  <TableCell>{getStatusBadge(item.percentualPresenca)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Relatório de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Desempenho por Estudante</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudante</TableHead>
                <TableHead>Total de Provas</TableHead>
                <TableHead>Média Geral</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoNotas.map((item) => (
                <TableRow key={item.estudante.id}>
                  <TableCell className="font-medium">{item.estudante.nome}</TableCell>
                  <TableCell>{item.totalProvas}</TableCell>
                  <TableCell className="font-bold">{item.mediaGeral.toFixed(1)}</TableCell>
                  <TableCell>{getSituacaoBadge(item.situacao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
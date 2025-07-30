import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Escola, Turma, Estudante, Matricula, Disciplina, Professor, RegistroFrequencia, ResumoFrequencia, RegistroNota, ResumoNotas } from '@/types';
import { CalendarDays, Users, BarChart3, FileText, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AcademicoTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  disciplinas: Disciplina[];
  professores: Professor[];
  registrosFrequencia: RegistroFrequencia[];
  onRegistrosFrequenciaChange?: (registros: RegistroFrequencia[]) => void;
  registrosNotas: RegistroNota[];
  onRegistrosNotasChange?: (registros: RegistroNota[]) => void;
}

export function AcademicoTab({ 
  escolas, 
  turmas, 
  estudantes, 
  matriculas,
  disciplinas,
  professores,
  registrosFrequencia,
  onRegistrosFrequenciaChange,
  registrosNotas,
  onRegistrosNotasChange 
}: AcademicoTabProps) {
  const [filtros, setFiltros] = useState({
    escola: 'all-schools',
    turma: 'all-classes',
    disciplina: 'all-subjects',
    data: '',
    busca: '',
  });

  const [isRegistroDialogOpen, setIsRegistroDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    turmaId: '',
    disciplinaId: '',
    professorId: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  const [presencas, setPresencas] = useState<{[estudanteId: string]: 'presente' | 'falta' | 'falta_justificada'}>({});
  const [justificativas, setJustificativas] = useState<{[estudanteId: string]: string}>({});

  // Estados para Notas
  const [isNotaDialogOpen, setIsNotaDialogOpen] = useState(false);
  const [formDataNota, setFormDataNota] = useState({
    turmaId: '',
    disciplinaId: '',
    professorId: '',
    tipo: 'prova' as const,
    valorMaximo: '10',
    peso: '1',
    descricao: '',
    dataAvaliacao: new Date().toISOString().split('T')[0],
    observacoes: '',
  });
  const [notasEstudantes, setNotasEstudantes] = useState<{[estudanteId: string]: string}>({});

  const turmasFiltradas = turmas.filter(t => 
    filtros.escola === 'all-schools' || t.escolaId === filtros.escola
  );

  const matriculasAtivas = matriculas.filter(m => m.status === 'ativa');

  const estudantesDaTurma = formData.turmaId ? 
    matriculasAtivas
      .filter(m => m.turmaId === formData.turmaId)
      .map(m => estudantes.find(e => e.id === m.estudanteId))
      .filter(Boolean) as Estudante[]
    : [];

  const estudantesDaTurmaNota = formDataNota.turmaId ? 
    matriculasAtivas
      .filter(m => m.turmaId === formDataNota.turmaId)
      .map(m => estudantes.find(e => e.id === m.estudanteId))
      .filter(Boolean) as Estudante[]
    : [];

  const disciplinasDaTurma = formData.turmaId ?
    turmas.find(t => t.id === formData.turmaId)?.disciplinas.map(dId => 
      disciplinas.find(d => d.id === dId)
    ).filter(Boolean) as Disciplina[]
    : [];

  const disciplinasDaTurmaNota = formDataNota.turmaId ?
    turmas.find(t => t.id === formDataNota.turmaId)?.disciplinas.map(dId => 
      disciplinas.find(d => d.id === dId)
    ).filter(Boolean) as Disciplina[]
    : [];

  const professoresDaDisciplina = formData.disciplinaId ?
    professores.filter(p => p.disciplinas.includes(formData.disciplinaId))
    : [];

  const professoresDaDisciplinaNota = formDataNota.disciplinaId ?
    professores.filter(p => p.disciplinas.includes(formDataNota.disciplinaId))
    : [];

  const handleRegistrarFrequencia = () => {
    if (!formData.turmaId || !formData.disciplinaId || !formData.professorId || !onRegistrosFrequenciaChange) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const novosRegistros: RegistroFrequencia[] = estudantesDaTurma.map(estudante => ({
      id: `${Date.now()}-${estudante.id}`,
      estudanteId: estudante.id,
      turmaId: formData.turmaId,
      disciplinaId: formData.disciplinaId,
      professorId: formData.professorId,
      data: formData.data,
      status: presencas[estudante.id] || 'presente',
      observacoes: formData.observacoes,
      justificativa: presencas[estudante.id] === 'falta_justificada' ? justificativas[estudante.id] : undefined,
    }));

    onRegistrosFrequenciaChange([...registrosFrequencia, ...novosRegistros]);
    
    setIsRegistroDialogOpen(false);
    setFormData({
      turmaId: '',
      disciplinaId: '',
      professorId: '',
      data: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setPresencas({});
    setJustificativas({});

    toast({
      title: "Sucesso",
      description: "Frequência registrada com sucesso!",
    });
  };

  const handleRegistrarNotas = () => {
    if (!formDataNota.turmaId || !formDataNota.disciplinaId || !formDataNota.professorId || !onRegistrosNotasChange) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const novasNotas: RegistroNota[] = estudantesDaTurmaNota
      .filter(estudante => notasEstudantes[estudante.id] !== undefined && notasEstudantes[estudante.id] !== '')
      .map(estudante => ({
        id: `${Date.now()}-${estudante.id}`,
        estudanteId: estudante.id,
        turmaId: formDataNota.turmaId,
        disciplinaId: formDataNota.disciplinaId,
        professorId: formDataNota.professorId,
        tipo: formDataNota.tipo,
        valor: parseFloat(notasEstudantes[estudante.id]),
        valorMaximo: parseFloat(formDataNota.valorMaximo),
        peso: parseFloat(formDataNota.peso),
        descricao: formDataNota.descricao,
        dataAvaliacao: formDataNota.dataAvaliacao,
        observacoes: formDataNota.observacoes,
      }));

    onRegistrosNotasChange([...registrosNotas, ...novasNotas]);
    
    setIsNotaDialogOpen(false);
    setFormDataNota({
      turmaId: '',
      disciplinaId: '',
      professorId: '',
      tipo: 'prova' as const,
      valorMaximo: '10',
      peso: '1',
      descricao: '',
      dataAvaliacao: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setNotasEstudantes({});

    toast({
      title: "Sucesso",
      description: "Notas registradas com sucesso!",
    });
  };

  const calcularResumoFrequencia = (): ResumoFrequencia[] => {
    const resumos: {[key: string]: ResumoFrequencia} = {};

    registrosFrequencia.forEach(registro => {
      const key = `${registro.estudanteId}-${registro.disciplinaId}`;
      
      if (!resumos[key]) {
        resumos[key] = {
          estudanteId: registro.estudanteId,
          disciplinaId: registro.disciplinaId,
          totalAulas: 0,
          presencas: 0,
          faltas: 0,
          faltasJustificadas: 0,
          percentualFrequencia: 0,
        };
      }

      resumos[key].totalAulas++;
      
      if (registro.status === 'presente') {
        resumos[key].presencas++;
      } else if (registro.status === 'falta') {
        resumos[key].faltas++;
      } else if (registro.status === 'falta_justificada') {
        resumos[key].faltasJustificadas++;
      }

      resumos[key].percentualFrequencia = 
        ((resumos[key].presencas + resumos[key].faltasJustificadas) / resumos[key].totalAulas) * 100;
    });

    return Object.values(resumos);
  };

  const calcularResumoNotas = (): ResumoNotas[] => {
    const resumos: {[key: string]: ResumoNotas} = {};

    registrosNotas.forEach(nota => {
      const key = `${nota.estudanteId}-${nota.disciplinaId}`;
      
      if (!resumos[key]) {
        resumos[key] = {
          estudanteId: nota.estudanteId,
          disciplinaId: nota.disciplinaId,
          notas: [],
          mediaFinal: 0,
          situacao: 'em_andamento',
        };
      }

      resumos[key].notas.push(nota);
    });

    // Calcular média final para cada resumo
    Object.values(resumos).forEach(resumo => {
      if (resumo.notas.length > 0) {
        const somaNotasPonderadas = resumo.notas.reduce((sum, nota) => 
          sum + (nota.valor * nota.peso), 0);
        const somaPesos = resumo.notas.reduce((sum, nota) => sum + nota.peso, 0);
        resumo.mediaFinal = somaPesos > 0 ? somaNotasPonderadas / somaPesos : 0;
        resumo.situacao = resumo.mediaFinal >= 7 ? 'aprovado' : 
                          resumo.mediaFinal >= 5 ? 'em_andamento' : 'reprovado';
      }
    });

    return Object.values(resumos);
  };

  const registrosFiltrados = registrosFrequencia.filter(registro => {
    const estudante = estudantes.find(e => e.id === registro.estudanteId);
    const matricula = matriculas.find(m => m.estudanteId === registro.estudanteId && m.turmaId === registro.turmaId);
    
    return (filtros.escola === 'all-schools' || matricula?.escolaId === filtros.escola) &&
           (filtros.turma === 'all-classes' || registro.turmaId === filtros.turma) &&
           (filtros.disciplina === 'all-subjects' || registro.disciplinaId === filtros.disciplina) &&
           (!filtros.data || registro.data === filtros.data) &&
           (!filtros.busca || 
            estudante?.nome.toLowerCase().includes(filtros.busca.toLowerCase())
           );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'presente':
        return <Badge className="bg-green-100 text-green-800">Presente</Badge>;
      case 'falta':
        return <Badge className="bg-red-100 text-red-800">Falta</Badge>;
      case 'falta_justificada':
        return <Badge className="bg-yellow-100 text-yellow-800">Falta Justificada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Módulo Acadêmico</h2>
        
        <div className="flex gap-2">
          <Dialog open={isRegistroDialogOpen} onOpenChange={setIsRegistroDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Frequência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Frequência da Aula</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="turma">Turma *</Label>
                    <Select value={formData.turmaId} onValueChange={(value) => {
                      setFormData({ ...formData, turmaId: value, disciplinaId: '', professorId: '' });
                      setPresencas({});
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} - {turma.turno}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="disciplina">Disciplina *</Label>
                    <Select 
                      value={formData.disciplinaId} 
                      onValueChange={(value) => setFormData({ ...formData, disciplinaId: value, professorId: '' })}
                      disabled={!formData.turmaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinasDaTurma.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="professor">Professor *</Label>
                    <Select 
                      value={formData.professorId} 
                      onValueChange={(value) => setFormData({ ...formData, professorId: value })}
                      disabled={!formData.disciplinaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professoresDaDisciplina.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data">Data da Aula *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações sobre a aula..."
                  />
                </div>

                {estudantesDaTurma.length > 0 && (
                  <div>
                    <Label>Lista de Presença</Label>
                    <div className="border rounded-lg mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Justificativa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estudantesDaTurma.map((estudante) => (
                            <TableRow key={estudante.id}>
                              <TableCell>{estudante.nome}</TableCell>
                              <TableCell>
                                <Select
                                  value={presencas[estudante.id] || 'presente'}
                                  onValueChange={(value: 'presente' | 'falta' | 'falta_justificada') => 
                                    setPresencas({ ...presencas, [estudante.id]: value })
                                  }
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="presente">Presente</SelectItem>
                                    <SelectItem value="falta">Falta</SelectItem>
                                    <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {presencas[estudante.id] === 'falta_justificada' && (
                                  <Input
                                    placeholder="Justificativa..."
                                    value={justificativas[estudante.id] || ''}
                                    onChange={(e) => setJustificativas({ 
                                      ...justificativas, 
                                      [estudante.id]: e.target.value 
                                    })}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRegistroDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRegistrarFrequencia}>
                  Registrar Frequência
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isNotaDialogOpen} onOpenChange={setIsNotaDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Notas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Notas da Avaliação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="turma">Turma *</Label>
                    <Select value={formDataNota.turmaId} onValueChange={(value) => {
                      setFormDataNota({ ...formDataNota, turmaId: value, disciplinaId: '', professorId: '' });
                      setNotasEstudantes({});
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome} - {turma.turno}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="disciplina">Disciplina *</Label>
                    <Select 
                      value={formDataNota.disciplinaId} 
                      onValueChange={(value) => setFormDataNota({ ...formDataNota, disciplinaId: value, professorId: '' })}
                      disabled={!formDataNota.turmaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinasDaTurmaNota.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="professor">Professor *</Label>
                    <Select 
                      value={formDataNota.professorId} 
                      onValueChange={(value) => setFormDataNota({ ...formDataNota, professorId: value })}
                      disabled={!formDataNota.disciplinaId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {professoresDaDisciplinaNota.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Avaliação *</Label>
                    <Select 
                      value={formDataNota.tipo} 
                      onValueChange={(value: any) => setFormDataNota({ ...formDataNota, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prova">Prova</SelectItem>
                        <SelectItem value="trabalho">Trabalho</SelectItem>
                        <SelectItem value="projeto">Projeto</SelectItem>
                        <SelectItem value="participacao">Participação</SelectItem>
                        <SelectItem value="recuperacao">Recuperação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="valorMaximo">Valor Máximo</Label>
                    <Input
                      id="valorMaximo"
                      type="number"
                      step="0.1"
                      value={formDataNota.valorMaximo}
                      onChange={(e) => setFormDataNota({ ...formDataNota, valorMaximo: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="peso">Peso</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      value={formDataNota.peso}
                      onChange={(e) => setFormDataNota({ ...formDataNota, peso: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataAvaliacao">Data da Avaliação *</Label>
                    <Input
                      id="dataAvaliacao"
                      type="date"
                      value={formDataNota.dataAvaliacao}
                      onChange={(e) => setFormDataNota({ ...formDataNota, dataAvaliacao: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={formDataNota.descricao}
                      onChange={(e) => setFormDataNota({ ...formDataNota, descricao: e.target.value })}
                      placeholder="Ex: Prova Bimestral..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formDataNota.observacoes}
                    onChange={(e) => setFormDataNota({ ...formDataNota, observacoes: e.target.value })}
                    placeholder="Observações sobre a avaliação..."
                  />
                </div>

                {estudantesDaTurmaNota.length > 0 && (
                  <div>
                    <Label>Notas dos Alunos</Label>
                    <div className="border rounded-lg mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Nota (0 a {formDataNota.valorMaximo})</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estudantesDaTurmaNota.map((estudante) => (
                            <TableRow key={estudante.id}>
                              <TableCell>{estudante.nome}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max={formDataNota.valorMaximo}
                                  placeholder="Digite a nota..."
                                  value={notasEstudantes[estudante.id] || ''}
                                  onChange={(e) => setNotasEstudantes({ 
                                    ...notasEstudantes, 
                                    [estudante.id]: e.target.value 
                                  })}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNotaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRegistrarNotas}>
                  Registrar Notas
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="frequencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frequencia" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frequencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registros de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <Label>Escola</Label>
                  <Select value={filtros.escola} onValueChange={(value) => setFiltros({ ...filtros, escola: value, turma: 'all-classes' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as escolas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-schools">Todas as escolas</SelectItem>
                      {escolas.filter(e => e.ativa).map((escola) => (
                        <SelectItem key={escola.id} value={escola.id}>
                          {escola.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Turma</Label>
                  <Select value={filtros.turma} onValueChange={(value) => setFiltros({ ...filtros, turma: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as turmas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-classes">Todas as turmas</SelectItem>
                      {turmasFiltradas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Disciplina</Label>
                  <Select value={filtros.disciplina} onValueChange={(value) => setFiltros({ ...filtros, disciplina: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as disciplinas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-subjects">Todas as disciplinas</SelectItem>
                      {disciplinas.map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={filtros.data}
                    onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Buscar Aluno</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome do aluno..."
                      value={filtros.busca}
                      onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Tabela de Registros */}
              {registrosFiltrados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum registro de frequência encontrado.</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Professor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosFiltrados.map((registro) => {
                        const estudante = estudantes.find(e => e.id === registro.estudanteId);
                        const turma = turmas.find(t => t.id === registro.turmaId);
                        const disciplina = disciplinas.find(d => d.id === registro.disciplinaId);
                        const professor = professores.find(p => p.id === registro.professorId);
                        
                        return (
                          <TableRow key={registro.id}>
                            <TableCell>{new Date(registro.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{estudante?.nome}</TableCell>
                            <TableCell>{turma?.nome}</TableCell>
                            <TableCell>{disciplina?.nome}</TableCell>
                            <TableCell>{professor?.nome}</TableCell>
                            <TableCell>{getStatusBadge(registro.status)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {registro.status === 'falta_justificada' && registro.justificativa ? 
                                registro.justificativa : registro.observacoes}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                Total de registros: {registrosFiltrados.length}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registros de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrosNotas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum registro de nota encontrado.</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosNotas.map((nota) => {
                        const estudante = estudantes.find(e => e.id === nota.estudanteId);
                        const disciplina = disciplinas.find(d => d.id === nota.disciplinaId);
                        
                        return (
                          <TableRow key={nota.id}>
                            <TableCell>{new Date(nota.dataAvaliacao).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{estudante?.nome}</TableCell>
                            <TableCell>{disciplina?.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {nota.tipo.charAt(0).toUpperCase() + nota.tipo.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{nota.descricao}</TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {nota.valor.toFixed(1)}/{nota.valorMaximo.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell>{nota.peso.toFixed(1)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                Total de registros: {registrosNotas.length}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Relatório de Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calcularResumoFrequencia().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum dado de frequência para gerar relatório.</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>% Freq.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calcularResumoFrequencia().map((resumo) => {
                          const estudante = estudantes.find(e => e.id === resumo.estudanteId);
                          const disciplina = disciplinas.find(d => d.id === resumo.disciplinaId);
                          
                          return (
                            <TableRow key={`${resumo.estudanteId}-${resumo.disciplinaId}`}>
                              <TableCell>{estudante?.nome}</TableCell>
                              <TableCell>{disciplina?.nome}</TableCell>
                              <TableCell>
                                <span className={`font-medium ${
                                  resumo.percentualFrequencia >= 75 ? 'text-green-600' :
                                  resumo.percentualFrequencia >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {resumo.percentualFrequencia.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatório de Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calcularResumoNotas().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum dado de notas para gerar relatório.</p>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>Média</TableHead>
                          <TableHead>Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calcularResumoNotas().map((resumo) => {
                          const estudante = estudantes.find(e => e.id === resumo.estudanteId);
                          const disciplina = disciplinas.find(d => d.id === resumo.disciplinaId);
                          
                          return (
                            <TableRow key={`${resumo.estudanteId}-${resumo.disciplinaId}`}>
                              <TableCell>{estudante?.nome}</TableCell>
                              <TableCell>{disciplina?.nome}</TableCell>
                              <TableCell>
                                <span className={`font-medium ${
                                  resumo.mediaFinal >= 7 ? 'text-green-600' :
                                  resumo.mediaFinal >= 5 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {resumo.mediaFinal.toFixed(1)}
                                </span>
                              </TableCell>
                              <TableCell>{getSituacaoBadge(resumo.situacao)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
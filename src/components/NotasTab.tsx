import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Escola, Turma, Estudante, Matricula, Disciplina, Professor, RegistroNota } from '@/types';
import { Search, Plus } from 'lucide-react';

interface NotasTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  disciplinas: Disciplina[];
  professores: Professor[];
  registrosNotas: RegistroNota[];
  onRegistrosNotasChange?: (registros: RegistroNota[]) => void;
}

export function NotasTab({
  escolas,
  turmas,
  estudantes,
  matriculas,
  disciplinas,
  professores,
  registrosNotas,
  onRegistrosNotasChange,
}: NotasTabProps) {
  const [filtros, setFiltros] = useState({
    escola: '',
    turma: '',
    disciplina: '',
    periodo: '',
    busca: '',
  });

  const [isNotaDialogOpen, setIsNotaDialogOpen] = useState(false);
  const [formDataNota, setFormDataNota] = useState({
    escola: '',
    turma: '',
    disciplina: '',
    periodo: '',
    professor: '',
  });
  const [notasEstudantes, setNotasEstudantes] = useState<{ [key: string]: string }>({});

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

  const professoresDaDisciplina = professores.filter((professor) =>
    professor.disciplinas.includes(formDataNota.disciplina)
  );

  const handleRegistrarNotas = () => {
    if (!formDataNota.escola || !formDataNota.turma || !formDataNota.disciplina || !formDataNota.periodo || !formDataNota.professor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const novosRegistros = estudantesDaTurma.map((estudante) => ({
      id: `${Date.now()}-${estudante.id}`,
      estudanteId: estudante.id,
      disciplinaId: formDataNota.disciplina,
      turmaId: formDataNota.turma,
      professorId: formDataNota.professor,
      tipo: 'prova' as const,
      valor: parseFloat(notasEstudantes[estudante.id] || '0'),
      valorMaximo: 10,
      peso: 1,
      descricao: `Avaliação - ${formDataNota.periodo}`,
      dataAvaliacao: new Date().toISOString().split('T')[0],
      observacoes: '',
    }));

    const registrosAtualizados = [...registrosNotas, ...novosRegistros];
    onRegistrosNotasChange?.(registrosAtualizados);

    setIsNotaDialogOpen(false);
    setFormDataNota({
      escola: '',
      turma: '',
      disciplina: '',
      periodo: '',
      professor: '',
    });
    setNotasEstudantes({});
  };

  const registrosFiltrados = registrosNotas.filter((registro) => {
    if (filtros.escola) {
      const turma = turmas.find(t => t.id === registro.turmaId);
      if (!turma || turma.escolaId !== filtros.escola) return false;
    }
    if (filtros.turma && registro.turmaId !== filtros.turma) return false;
    if (filtros.disciplina && registro.disciplinaId !== filtros.disciplina) return false;
    if (filtros.periodo && !registro.descricao.includes(filtros.periodo)) return false;
    
    if (filtros.busca) {
      const estudante = estudantes.find(e => e.id === registro.estudanteId);
      const disciplina = disciplinas.find(d => d.id === registro.disciplinaId);
      const busca = filtros.busca.toLowerCase();
      return (
        estudante?.nome.toLowerCase().includes(busca) ||
        disciplina?.nome.toLowerCase().includes(busca)
      );
    }
    
    return true;
  });

  const getSituacaoBadge = (nota: number) => {
    if (nota >= 7) return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    if (nota >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Em Recuperação</Badge>;
    return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">📝 Gestão de Notas</h1>
        <Dialog open={isNotaDialogOpen} onOpenChange={setIsNotaDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Notas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Notas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Escola</label>
                  <Select value={formDataNota.escola} onValueChange={(value) => setFormDataNota({...formDataNota, escola: value, turma: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                    <SelectContent>
                      {escolas.map((escola) => (
                        <SelectItem key={escola.id} value={escola.id}>
                          {escola.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Turma</label>
                  <Select value={formDataNota.turma} onValueChange={(value) => setFormDataNota({...formDataNota, turma: value, disciplina: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.filter(t => t.escolaId === formDataNota.escola).map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={formDataNota.disciplina} onValueChange={(value) => setFormDataNota({...formDataNota, disciplina: value, professor: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.filter(d => 
                        turmas.find(t => t.id === formDataNota.turma)?.disciplinas?.includes(d.id)
                      ).map((disciplina) => (
                        <SelectItem key={disciplina.id} value={disciplina.id}>
                          {disciplina.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Professor</label>
                  <Select value={formDataNota.professor} onValueChange={(value) => setFormDataNota({...formDataNota, professor: value})}>
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
                  <label className="text-sm font-medium">Período</label>
                  <Select value={formDataNota.periodo} onValueChange={(value) => setFormDataNota({...formDataNota, periodo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1º Bimestre">1º Bimestre</SelectItem>
                      <SelectItem value="2º Bimestre">2º Bimestre</SelectItem>
                      <SelectItem value="3º Bimestre">3º Bimestre</SelectItem>
                      <SelectItem value="4º Bimestre">4º Bimestre</SelectItem>
                      <SelectItem value="Recuperação">Recuperação</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formDataNota.turma && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Notas dos Estudantes</h3>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {estudantesDaTurma.map((estudante) => (
                      <div key={estudante.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{estudante.nome}</span>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="Nota"
                          className="w-20"
                          value={notasEstudantes[estudante.id] || ''}
                          onChange={(e) => setNotasEstudantes({...notasEstudantes, [estudante.id]: e.target.value})}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsNotaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRegistrarNotas}>
                  Registrar Notas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

            <Select value={filtros.periodo} onValueChange={(value) => setFiltros({...filtros, periodo: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Todos os períodos</SelectItem>
                <SelectItem value="1º Bimestre">1º Bimestre</SelectItem>
                <SelectItem value="2º Bimestre">2º Bimestre</SelectItem>
                <SelectItem value="3º Bimestre">3º Bimestre</SelectItem>
                <SelectItem value="4º Bimestre">4º Bimestre</SelectItem>
                <SelectItem value="Recuperação">Recuperação</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Notas ({registrosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Estudante</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Situação</TableHead>
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
                  <TableCell>{new Date(registro.dataAvaliacao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{estudante?.nome}</TableCell>
                  <TableCell>{turma?.nome}</TableCell>
                  <TableCell>{disciplina?.nome}</TableCell>
                  <TableCell>{professor?.nome}</TableCell>
                  <TableCell>{registro.descricao}</TableCell>
                  <TableCell className="font-bold">{registro.valor.toFixed(1)}</TableCell>
                  <TableCell>{getSituacaoBadge(registro.valor)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
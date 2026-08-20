
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Escola, Turma, Estudante, Matricula } from '@/types';
import { Users, Download, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';

interface AlunosTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  onEstudantesChange?: (estudantes: Estudante[]) => void;
  onMatriculasChange?: (matriculas: Matricula[]) => void;
}

export function AlunosTab({ 
  escolas, 
  turmas, 
  estudantes, 
  matriculas,
  onEstudantesChange,
  onMatriculasChange 
}: AlunosTabProps) {
  const { hasPermissao } = useAuth();
  const podeEditar = hasPermissao('editar_alunos');
  const podeExcluir = hasPermissao('excluir_alunos');
  const [filtros, setFiltros] = useState({
    escola: 'all-schools',
    turma: 'all-classes',
    turno: 'all-shifts',
    busca: '',
  });

  const [editingStudent, setEditingStudent] = useState<Estudante | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Estudante>>({});

  const gerarComprovantePDF = (matricula: Matricula, estudante: Estudante) => {
    const doc = new jsPDF();
    const escola = escolas.find(e => e.id === matricula.escolaId);
    const turma = turmas.find(t => t.id === matricula.turmaId);

    doc.setFontSize(20);
    doc.text('COMPROVANTE DE MATRÍCULA', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Escola: ${escola?.nome || 'N/A'}`, 20, 50);
    doc.text(`Número da Matrícula: ${matricula.numeroMatricula}`, 20, 60);
    doc.text(`Data da Matrícula: ${new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}`, 20, 70);
    
    doc.setFontSize(14);
    doc.text('DADOS DO ESTUDANTE', 20, 90);
    doc.setFontSize(12);
    doc.text(`Nome: ${estudante.nome}`, 20, 105);
    doc.text(`CPF: ${estudante.cpf}`, 20, 115);
    doc.text(`Data de Nascimento: ${new Date(estudante.dataNascimento).toLocaleDateString('pt-BR')}`, 20, 125);
    doc.text(`E-mail: ${estudante.email}`, 20, 135);
    doc.text(`Telefone: ${estudante.telefone}`, 20, 145);
    
    doc.setFontSize(14);
    doc.text('DADOS DA TURMA', 20, 165);
    doc.setFontSize(12);
    doc.text(`Turma: ${turma?.nome || 'N/A'}`, 20, 180);
    doc.text(`Série: ${turma?.serie || 'N/A'}`, 20, 190);
    doc.text(`Turno: ${turma?.turno || 'N/A'}`, 20, 200);

    doc.save(`comprovante-${matricula.numeroMatricula}.pdf`);
  };

  const handleEditStudent = (estudante: Estudante) => {
    setEditingStudent(estudante);
    setFormData({
      nome: estudante.nome,
      cpf: estudante.cpf,
      dataNascimento: estudante.dataNascimento,
      email: estudante.email,
      telefone: estudante.telefone,
      endereco: estudante.endereco,
      nomeResponsavel: estudante.nomeResponsavel || '',
      telefoneResponsavel: estudante.telefoneResponsavel || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveStudent = () => {
    if (!editingStudent || !onEstudantesChange) return;

    const updatedStudents = estudantes.map(estudante =>
      estudante.id === editingStudent.id
        ? { ...estudante, ...formData }
        : estudante
    );

    onEstudantesChange(updatedStudents);
    setIsEditDialogOpen(false);
    setEditingStudent(null);
    setFormData({});
    
    toast({
      title: "Sucesso",
      description: "Dados do aluno atualizados com sucesso!",
    });
  };

  const handleDeleteStudent = (estudanteId: string) => {
    if (!onEstudantesChange || !onMatriculasChange) return;

    // Remove o estudante
    const updatedStudents = estudantes.filter(e => e.id !== estudanteId);
    onEstudantesChange(updatedStudents);

    // Remove todas as matrículas do estudante
    const updatedMatriculas = matriculas.filter(m => m.estudanteId !== estudanteId);
    onMatriculasChange(updatedMatriculas);

    toast({
      title: "Sucesso",
      description: "Aluno e suas matrículas foram excluídos com sucesso!",
    });
  };

  const turmasFiltradas = turmas.filter(t => 
    (filtros.escola === 'all-schools' || t.escolaId === filtros.escola) &&
    (filtros.turno === 'all-shifts' || t.turno === filtros.turno)
  );

  const matriculasFiltradas = matriculas.filter(matricula => {
    const estudante = estudantes.find(e => e.id === matricula.estudanteId);
    const turma = turmas.find(t => t.id === matricula.turmaId);
    
    return (filtros.escola === 'all-schools' || matricula.escolaId === filtros.escola) &&
           (filtros.turma === 'all-classes' || matricula.turmaId === filtros.turma) &&
           (filtros.turno === 'all-shifts' || turma?.turno === filtros.turno) &&
           (!filtros.busca || 
            estudante?.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
            matricula.numeroMatricula.includes(filtros.busca)
           );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alunos Matriculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <Label>Turno</Label>
              <Select value={filtros.turno} onValueChange={(value) => setFiltros({ ...filtros, turno: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-shifts">Todos os turnos</SelectItem>
                  <SelectItem value="manhã">Manhã</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                  <SelectItem value="noite">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou matrícula..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          {matriculasFiltradas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum aluno encontrado com os filtros aplicados.</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Matrícula</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matriculasFiltradas.map((matricula) => {
                    const estudante = estudantes.find(e => e.id === matricula.estudanteId);
                    const escola = escolas.find(e => e.id === matricula.escolaId);
                    const turma = turmas.find(t => t.id === matricula.turmaId);
                    
                    return (
                      <TableRow key={matricula.id}>
                        <TableCell className="font-medium">{matricula.numeroMatricula}</TableCell>
                        <TableCell>{estudante?.nome}</TableCell>
                        <TableCell>{escola?.nome}</TableCell>
                        <TableCell>{turma?.nome}</TableCell>
                        <TableCell className="capitalize">{turma?.turno}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            matricula.status === 'ativa' ? 'bg-green-100 text-green-800' :
                            matricula.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {matricula.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => estudante && gerarComprovantePDF(matricula, estudante)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            {estudante && (
                              <>
                                {podeEditar && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditStudent(estudante)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                )}

                                {podeExcluir && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o aluno "{estudante.nome}"? Esta ação também removerá todas as matrículas do aluno e não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteStudent(estudante.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Total de alunos: {matriculasFiltradas.length}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Dados do Aluno</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do aluno"
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento || ''}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco || ''}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div>
              <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
              <Input
                id="nomeResponsavel"
                value={formData.nomeResponsavel || ''}
                onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                placeholder="Nome do responsável (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="telefoneResponsavel">Telefone do Responsável</Label>
              <Input
                id="telefoneResponsavel"
                value={formData.telefoneResponsavel || ''}
                onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStudent}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

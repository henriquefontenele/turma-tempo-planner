import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Plus, Pencil, Award, Eye } from 'lucide-react';
import { MatriculaEAD, CursoEAD, Estudante, Escola } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';

export function MatriculasEADTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<MatriculaEAD | null>(null);
  const [selectedCurso, setSelectedCurso] = useState('');

  const { data: matriculas, addItem, updateItem } = useFirestoreCollection<MatriculaEAD>('matriculasEAD');
  const { data: cursos } = useFirestoreCollection<CursoEAD>('cursosEAD', false);
  const { data: estudantes } = useFirestoreCollection<Estudante>('estudantes');
  const { data: escolas } = useFirestoreCollection<Escola>('escolas', false);

  const [formData, setFormData] = useState<Partial<MatriculaEAD>>({
    cursoId: '',
    estudanteId: '',
    escolaId: '',
    dataMatricula: new Date().toISOString().split('T')[0],
    status: 'ativa',
    progresso: 0,
    dataConclusao: '',
    notaFinal: undefined,
    certificadoUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cursoId || !formData.estudanteId || !formData.escolaId) {
      toast({
        title: 'Erro',
        description: 'Curso, estudante e escola são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    // Verifica se já existe matrícula ativa
    const matriculaExistente = matriculas.find(
      m => m.cursoId === formData.cursoId && 
           m.estudanteId === formData.estudanteId && 
           m.status === 'ativa' &&
           (!editingMatricula || m.id !== editingMatricula.id)
    );

    if (matriculaExistente) {
      toast({
        title: 'Erro',
        description: 'Este estudante já está matriculado neste curso',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingMatricula) {
        await updateItem(editingMatricula.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Matrícula atualizada com sucesso',
        });
      } else {
        await addItem(formData as any);
        toast({
          title: 'Sucesso',
          description: 'Matrícula realizada com sucesso',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar matrícula',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (matricula: MatriculaEAD) => {
    setEditingMatricula(matricula);
    setFormData(matricula);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMatricula(null);
    setFormData({
      cursoId: '',
      estudanteId: '',
      escolaId: '',
      dataMatricula: new Date().toISOString().split('T')[0],
      status: 'ativa',
      progresso: 0,
      dataConclusao: '',
      notaFinal: undefined,
      certificadoUrl: '',
    });
  };

  const filteredMatriculas = selectedCurso
    ? matriculas.filter(m => m.cursoId === selectedCurso)
    : matriculas;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500">Ativa</Badge>;
      case 'concluida':
        return <Badge className="bg-blue-500">Concluída</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'trancada':
        return <Badge variant="outline">Trancada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Matrículas EAD
              </CardTitle>
              <CardDescription>Gerencie as matrículas dos estudantes nos cursos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Matrícula
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMatricula ? 'Editar Matrícula' : 'Nova Matrícula EAD'}
                  </DialogTitle>
                  <DialogDescription>
                    Matricule um estudante em um curso EAD
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="cursoId">Curso *</Label>
                      <Select
                        value={formData.cursoId}
                        onValueChange={(value) => setFormData({ ...formData, cursoId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um curso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.filter(c => c.status === 'publicado').map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="estudanteId">Estudante *</Label>
                      <Select
                        value={formData.estudanteId}
                        onValueChange={(value) => setFormData({ ...formData, estudanteId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estudante..." />
                        </SelectTrigger>
                        <SelectContent>
                          {estudantes.map((estudante) => (
                            <SelectItem key={estudante.id} value={estudante.id}>
                              {estudante.nome} - {estudante.cpf || estudante.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="escolaId">Escola *</Label>
                      <Select
                        value={formData.escolaId}
                        onValueChange={(value) => setFormData({ ...formData, escolaId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma escola..." />
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
                      <Label htmlFor="dataMatricula">Data da Matrícula *</Label>
                      <Input
                        id="dataMatricula"
                        type="date"
                        value={formData.dataMatricula}
                        onChange={(e) => setFormData({ ...formData, dataMatricula: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">Ativa</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                          <SelectItem value="trancada">Trancada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingMatricula && (
                      <>
                        <div>
                          <Label htmlFor="progresso">Progresso (%)</Label>
                          <Input
                            id="progresso"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.progresso}
                            onChange={(e) => setFormData({ ...formData, progresso: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="notaFinal">Nota Final</Label>
                          <Input
                            id="notaFinal"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={formData.notaFinal || ''}
                            onChange={(e) => setFormData({ ...formData, notaFinal: parseFloat(e.target.value) || undefined })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="dataConclusao">Data de Conclusão</Label>
                          <Input
                            id="dataConclusao"
                            type="date"
                            value={formData.dataConclusao}
                            onChange={(e) => setFormData({ ...formData, dataConclusao: e.target.value })}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="certificadoUrl">URL do Certificado</Label>
                          <Input
                            id="certificadoUrl"
                            type="url"
                            value={formData.certificadoUrl}
                            onChange={(e) => setFormData({ ...formData, certificadoUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingMatricula ? 'Atualizar' : 'Matricular'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filtrar por Curso</Label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os cursos</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    {curso.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredMatriculas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma matrícula cadastrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Matrícula</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatriculas.map((matricula) => {
                  const curso = cursos.find(c => c.id === matricula.cursoId);
                  const estudante = estudantes.find(e => e.id === matricula.estudanteId);
                  const escola = escolas.find(e => e.id === matricula.escolaId);
                  return (
                    <TableRow key={matricula.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{estudante?.nome || '-'}</div>
                          <div className="text-sm text-gray-500">{estudante?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{curso?.nome || '-'}</TableCell>
                      <TableCell>{escola?.nome || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={matricula.progresso} className="w-20" />
                          <div className="text-xs text-gray-500">{matricula.progresso}%</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(matricula.status)}</TableCell>
                      <TableCell>
                        {new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {matricula.certificadoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(matricula.certificadoUrl, '_blank')}
                            >
                              <Award className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(matricula)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
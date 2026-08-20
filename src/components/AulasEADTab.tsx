import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, Plus, Pencil, Trash2, FileText, Link2, HelpCircle } from 'lucide-react';
import { AulaEAD, CursoEAD, ModuloEAD } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';

export function AulasEADTab() {
  const { toast } = useToast();
  const { hasPermissao } = useAuth();
  const podeCriar = hasPermissao('criar_aulas_ead');
  const podeEditar = hasPermissao('editar_aulas_ead');
  const podeExcluir = hasPermissao('excluir_aulas_ead');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<AulaEAD | null>(null);
  const [selectedCurso, setSelectedCurso] = useState('all');

  const { data: aulas, addItem, updateItem, deleteItem } = useFirestoreCollection<AulaEAD>('aulasEAD');
  const { data: cursos } = useFirestoreCollection<CursoEAD>('cursosEAD', false);
  const { data: modulos } = useFirestoreCollection<ModuloEAD>('modulosEAD', false);

  const [formData, setFormData] = useState<Partial<AulaEAD>>({
    cursoId: '',
    moduloId: 'none',
    titulo: '',
    descricao: '',
    tipo: 'video',
    conteudo: '',
    duracao: 0,
    ordem: 0,
    obrigatoria: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cursoId || !formData.titulo?.trim() || !formData.conteudo?.trim()) {
      toast({
        title: 'Erro',
        description: 'Curso, título e conteúdo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const submitData = {
        ...formData,
        moduloId: formData.moduloId === 'none' ? '' : formData.moduloId,
      };
      
      if (editingAula) {
        await updateItem(editingAula.id, submitData);
        toast({
          title: 'Sucesso',
          description: 'Aula atualizada com sucesso',
        });
      } else {
        await addItem(submitData as any);
        toast({
          title: 'Sucesso',
          description: 'Aula cadastrada com sucesso',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar aula',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (aula: AulaEAD) => {
    setEditingAula(aula);
    setFormData({
      ...aula,
      moduloId: aula.moduloId || 'none',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
      try {
        await deleteItem(id);
        toast({
          title: 'Sucesso',
          description: 'Aula excluída com sucesso',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir aula',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAula(null);
    setFormData({
      cursoId: '',
      moduloId: 'none',
      titulo: '',
      descricao: '',
      tipo: 'video',
      conteudo: '',
      duracao: 0,
      ordem: 0,
      obrigatoria: true,
    });
  };

  const filteredAulas = (selectedCurso && selectedCurso !== 'all')
    ? aulas.filter(aula => aula.cursoId === selectedCurso)
    : aulas;

  const sortedAulas = [...filteredAulas].sort((a, b) => a.ordem - b.ordem);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'texto':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'link':
        return <Link2 className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const colors = {
      video: 'bg-red-500',
      texto: 'bg-blue-500',
      pdf: 'bg-orange-500',
      link: 'bg-green-500',
      quiz: 'bg-purple-500',
    };
    return <Badge className={colors[tipo as keyof typeof colors]}>{tipo}</Badge>;
  };

  const modulosDoCurso = (selectedCurso && selectedCurso !== 'all')
    ? modulos.filter(m => m.cursoId === selectedCurso)
    : modulos;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Aulas e Conteúdos EAD
              </CardTitle>
              <CardDescription>Gerencie as aulas e materiais dos cursos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              {podeCriar && (
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Aula
                </Button>
              </DialogTrigger>
              )}
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAula ? 'Editar Aula' : 'Nova Aula EAD'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados da aula ou conteúdo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="cursoId">Curso *</Label>
                      <Select
                        value={formData.cursoId}
                        onValueChange={(value) => setFormData({ ...formData, cursoId: value, moduloId: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um curso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={curso.id}>
                              {curso.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="moduloId">Módulo (opcional)</Label>
                      <Select
                        value={formData.moduloId || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, moduloId: value })}
                        disabled={!formData.cursoId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um módulo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {modulosDoCurso
                            .filter(m => m.cursoId === formData.cursoId)
                            .map((modulo) => (
                              <SelectItem key={modulo.id} value={modulo.id}>
                                {modulo.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="titulo">Título da Aula *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ex: Introdução aos números"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descreva o conteúdo da aula..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="texto">Texto</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="link">Link Externo</SelectItem>
                          <SelectItem value="quiz">Quiz/Questionário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duracao">Duração (minutos)</Label>
                      <Input
                        id="duracao"
                        type="number"
                        min="0"
                        value={formData.duracao}
                        onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="conteudo">
                        {formData.tipo === 'video' ? 'URL do Vídeo *' : 
                         formData.tipo === 'pdf' ? 'URL do PDF *' :
                         formData.tipo === 'link' ? 'Link *' :
                         'Conteúdo *'}
                      </Label>
                      <Input
                        id="conteudo"
                        value={formData.conteudo}
                        onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                        placeholder={
                          formData.tipo === 'video' ? 'https://youtube.com/...' :
                          formData.tipo === 'pdf' ? 'https://...' :
                          formData.tipo === 'link' ? 'https://...' :
                          'Digite o conteúdo...'
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input
                        id="ordem"
                        type="number"
                        min="0"
                        value={formData.ordem}
                        onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="obrigatoria"
                        checked={formData.obrigatoria}
                        onChange={(e) => setFormData({ ...formData, obrigatoria: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="obrigatoria" className="cursor-pointer">
                        Aula obrigatória
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingAula ? 'Atualizar' : 'Cadastrar'}
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

          {sortedAulas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma aula cadastrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Obrigatória</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAulas.map((aula) => {
                  const curso = cursos.find(c => c.id === aula.cursoId);
                  return (
                    <TableRow key={aula.id}>
                      <TableCell>{aula.ordem}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoIcon(aula.tipo)}
                          <div>
                            <div className="font-medium">{aula.titulo}</div>
                            {aula.descricao && (
                              <div className="text-sm text-gray-500 line-clamp-1">{aula.descricao}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{curso?.nome || '-'}</TableCell>
                      <TableCell>{getTipoBadge(aula.tipo)}</TableCell>
                      <TableCell>{aula.duracao ? `${aula.duracao} min` : '-'}</TableCell>
                      <TableCell>
                        {aula.obrigatoria ? (
                          <Badge variant="outline">Sim</Badge>
                        ) : (
                          <Badge variant="secondary">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {podeEditar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(aula)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          )}
                          {podeExcluir && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(aula.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          )}
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
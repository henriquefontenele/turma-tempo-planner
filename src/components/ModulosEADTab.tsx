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
import { useToast } from '@/hooks/use-toast';
import { Layers, Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { ModuloEAD, CursoEAD } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';

export function ModulosEADTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloEAD | null>(null);
  const [selectedCurso, setSelectedCurso] = useState('');

  const { data: modulos, addItem, updateItem, deleteItem } = useFirestoreCollection<ModuloEAD>('modulosEAD');
  const { data: cursos } = useFirestoreCollection<CursoEAD>('cursosEAD', false);

  const [formData, setFormData] = useState<Partial<ModuloEAD>>({
    cursoId: '',
    nome: '',
    descricao: '',
    ordem: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cursoId || !formData.nome) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingModulo) {
        await updateItem(editingModulo.id, {
          ...formData,
          updatedAt: new Date(),
        } as any);
        toast({
          title: 'Sucesso',
          description: 'Módulo atualizado com sucesso',
        });
      } else {
        await addItem({
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        toast({
          title: 'Sucesso',
          description: 'Módulo criado com sucesso',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar módulo',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (modulo: ModuloEAD) => {
    setEditingModulo(modulo);
    setFormData(modulo);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo?')) return;
    
    try {
      await deleteItem(id);
      toast({
        title: 'Sucesso',
        description: 'Módulo excluído com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir módulo',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingModulo(null);
    setFormData({
      cursoId: '',
      nome: '',
      descricao: '',
      ordem: 1,
    });
  };

  const filteredModulos = selectedCurso
    ? modulos.filter(m => m.cursoId === selectedCurso)
    : modulos;

  const sortedModulos = [...filteredModulos].sort((a, b) => a.ordem - b.ordem);

  console.debug('[ModulosEADTab] render', { modulos: modulos.length, cursos: cursos.length });
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Módulos EAD
            </CardTitle>
            <CardDescription>
              Organize o conteúdo dos cursos em módulos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingModulo ? 'Editar Módulo' : 'Novo Módulo'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do módulo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cursoId">Curso *</Label>
                    <Select
                      value={formData.cursoId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cursoId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
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

                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Módulo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Introdução ao Tema"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descreva o conteúdo do módulo"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ordem">Ordem</Label>
                    <Input
                      id="ordem"
                      type="number"
                      min="1"
                      value={formData.ordem}
                      onChange={(e) =>
                        setFormData({ ...formData, ordem: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingModulo ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
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
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-4 h-4" />
                    Ordem
                  </div>
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModulos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum módulo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedModulos.map((modulo) => {
                  const curso = cursos.find((c) => c.id === modulo.cursoId);
                  return (
                    <TableRow key={modulo.id}>
                      <TableCell>{modulo.ordem}</TableCell>
                      <TableCell className="font-medium">{modulo.nome}</TableCell>
                      <TableCell>{curso?.nome || 'N/A'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {modulo.descricao}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(modulo)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(modulo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

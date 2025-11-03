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
import { Video, Plus, Pencil, Trash2, Eye, Globe } from 'lucide-react';
import { CursoEAD, Escola, Disciplina } from '@/types';
import { useFirestoreCollection } from '@/hooks/useFirestore';

export function CursosEADTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<CursoEAD | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cursos, addItem, updateItem, deleteItem } = useFirestoreCollection<CursoEAD>('cursosEAD');
  const { data: escolas } = useFirestoreCollection<Escola>('escolas', false);
  const { data: disciplinas } = useFirestoreCollection<Disciplina>('disciplinas', false);

  const [formData, setFormData] = useState<Partial<CursoEAD>>({
    nome: '',
    descricao: '',
    cargaHoraria: 0,
    disciplinaId: '',
    escolaIds: [],
    status: 'rascunho',
    dataInicio: '',
    dataFim: '',
    plataforma: '',
    linkPlataforma: '',
    imagemUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome?.trim() || !formData.descricao?.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome e descrição são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (formData.escolaIds!.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma escola',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCurso) {
        await updateItem(editingCurso.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Curso atualizado com sucesso',
        });
      } else {
        await addItem(formData as any);
        toast({
          title: 'Sucesso',
          description: 'Curso cadastrado com sucesso',
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar curso',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (curso: CursoEAD) => {
    setEditingCurso(curso);
    setFormData(curso);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await deleteItem(id);
        toast({
          title: 'Sucesso',
          description: 'Curso excluído com sucesso',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir curso',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCurso(null);
    setFormData({
      nome: '',
      descricao: '',
      cargaHoraria: 0,
      disciplinaId: '',
      escolaIds: [],
      status: 'rascunho',
      dataInicio: '',
      dataFim: '',
      plataforma: '',
      linkPlataforma: '',
      imagemUrl: '',
    });
  };

  const toggleEscola = (escolaId: string) => {
    const escolaIds = formData.escolaIds || [];
    if (escolaIds.includes(escolaId)) {
      setFormData({ ...formData, escolaIds: escolaIds.filter(id => id !== escolaId) });
    } else {
      setFormData({ ...formData, escolaIds: [...escolaIds, escolaId] });
    }
  };

  const filteredCursos = cursos.filter(curso =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'publicado':
        return <Badge className="bg-green-500">Publicado</Badge>;
      case 'rascunho':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'arquivado':
        return <Badge variant="outline">Arquivado</Badge>;
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
                <Video className="w-5 h-5" />
                Cursos EAD
              </CardTitle>
              <CardDescription>Gerencie os cursos de educação a distância</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCurso ? 'Editar Curso' : 'Novo Curso EAD'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do curso de educação a distância
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nome">Nome do Curso *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Matemática Básica"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="descricao">Descrição *</Label>
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descreva o conteúdo do curso..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
                      <Input
                        id="cargaHoraria"
                        type="number"
                        min="0"
                        value={formData.cargaHoraria}
                        onChange={(e) => setFormData({ ...formData, cargaHoraria: parseInt(e.target.value) })}
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
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="publicado">Publicado</SelectItem>
                          <SelectItem value="arquivado">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="disciplinaId">Disciplina Relacionada</Label>
                      <Select
                        value={formData.disciplinaId}
                        onValueChange={(value) => setFormData({ ...formData, disciplinaId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {disciplinas.map((disc) => (
                            <SelectItem key={disc.id} value={disc.id}>
                              {disc.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="plataforma">Plataforma</Label>
                      <Input
                        id="plataforma"
                        value={formData.plataforma}
                        onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                        placeholder="Ex: Google Meet, Zoom..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="dataInicio">Data de Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={formData.dataInicio}
                        onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dataFim">Data de Término</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={formData.dataFim}
                        onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="linkPlataforma">Link da Plataforma</Label>
                      <Input
                        id="linkPlataforma"
                        type="url"
                        value={formData.linkPlataforma}
                        onChange={(e) => setFormData({ ...formData, linkPlataforma: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="imagemUrl">URL da Imagem do Curso</Label>
                      <Input
                        id="imagemUrl"
                        type="url"
                        value={formData.imagemUrl}
                        onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Escolas *</Label>
                      <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                        {escolas.map((escola) => (
                          <div key={escola.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`escola-${escola.id}`}
                              checked={formData.escolaIds?.includes(escola.id)}
                              onChange={() => toggleEscola(escola.id)}
                              className="rounded"
                            />
                            <label htmlFor={`escola-${escola.id}`} className="text-sm cursor-pointer">
                              {escola.nome}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCurso ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredCursos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum curso cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCursos.map((curso) => {
                  const disciplina = disciplinas.find(d => d.id === curso.disciplinaId);
                  return (
                    <TableRow key={curso.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{curso.nome}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{curso.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {disciplina ? disciplina.nome : '-'}
                      </TableCell>
                      <TableCell>{curso.cargaHoraria}h</TableCell>
                      <TableCell>{getStatusBadge(curso.status)}</TableCell>
                      <TableCell>
                        {curso.dataInicio && curso.dataFim ? (
                          <div className="text-sm">
                            {new Date(curso.dataInicio).toLocaleDateString('pt-BR')} -{' '}
                            {new Date(curso.dataFim).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {curso.linkPlataforma && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(curso.linkPlataforma, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(curso)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(curso.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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
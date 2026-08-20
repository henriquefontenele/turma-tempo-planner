
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Disciplina } from '@/types';
import { Plus, Trash, Edit } from 'lucide-react';

export function DisciplinasTab() {
  const { hasPermissao } = useAuth();
  const podeCriar = hasPermissao('criar_disciplinas');
  const podeEditar = hasPermissao('editar_disciplinas');
  const podeExcluir = hasPermissao('excluir_disciplinas');
  const { data: disciplinas, addItem: addDisciplina, updateItem: updateDisciplina, deleteItem: deleteDisciplina, loading, error } = useFirestoreCollection<Disciplina>('disciplinas', false);
  const [formData, setFormData] = useState({
    nome: '',
    cargaHorariaSemanal: 4,
    permiteAulasGeminadas: false,
  });
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da disciplina é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const novaDisciplina = {
      nome: formData.nome.trim(),
      cargaHorariaSemanal: formData.cargaHorariaSemanal,
      permiteAulasGeminadas: formData.permiteAulasGeminadas,
    };

    await addDisciplina(novaDisciplina);
    setFormData({ nome: '', cargaHorariaSemanal: 4, permiteAulasGeminadas: false });
    
    toast({
      title: "Sucesso",
      description: "Disciplina cadastrada com sucesso!",
    });
  };

  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleEditSubmit called', editingDisciplina);
    
    if (!editingDisciplina || !editingDisciplina.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da disciplina é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Updating disciplina:', editingDisciplina.id, {
        nome: editingDisciplina.nome.trim(),
        cargaHorariaSemanal: editingDisciplina.cargaHorariaSemanal,
        permiteAulasGeminadas: editingDisciplina.permiteAulasGeminadas,
      });
      
      await updateDisciplina(editingDisciplina.id, {
        nome: editingDisciplina.nome.trim(),
        cargaHorariaSemanal: editingDisciplina.cargaHorariaSemanal,
        permiteAulasGeminadas: editingDisciplina.permiteAulasGeminadas,
      });
      
      setEditModalOpen(false);
      setEditingDisciplina(null);
      
      toast({
        title: "Sucesso",
        description: "Disciplina atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar disciplina",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDisciplina(id);
    toast({
      title: "Sucesso",
      description: "Disciplina removida com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      {podeCriar && (
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Disciplina</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Matemática"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="carga">Carga Horária Semanal</Label>
                <Input
                  id="carga"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ex: 4"
                  value={formData.cargaHorariaSemanal}
                  onChange={(e) => setFormData({ ...formData, cargaHorariaSemanal: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="geminadas"
                  checked={formData.permiteAulasGeminadas}
                  onCheckedChange={(checked) => setFormData({ ...formData, permiteAulasGeminadas: checked })}
                />
                <Label htmlFor="geminadas">Permite Aulas Geminadas?</Label>
              </div>
            </div>

            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disciplina
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Disciplinas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {disciplinas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma disciplina cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{disciplina.nome}</h4>
                    <p className="text-sm text-gray-600">
                      {disciplina.cargaHorariaSemanal}h/semana • 
                      {disciplina.permiteAulasGeminadas ? ' Permite geminadas' : ' Não permite geminadas'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {podeEditar && (
                    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(disciplina)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Disciplina</DialogTitle>
                        </DialogHeader>
                        {editingDisciplina && (
                          <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-nome">Nome da Disciplina</Label>
                              <Input
                                id="edit-nome"
                                value={editingDisciplina.nome}
                                onChange={(e) => setEditingDisciplina({ ...editingDisciplina, nome: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-carga">Carga Horária Semanal</Label>
                              <Input
                                id="edit-carga"
                                type="number"
                                min="1"
                                max="20"
                                value={editingDisciplina.cargaHorariaSemanal}
                                onChange={(e) => setEditingDisciplina({ ...editingDisciplina, cargaHorariaSemanal: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="edit-geminadas"
                                checked={editingDisciplina.permiteAulasGeminadas}
                                onCheckedChange={(checked) => setEditingDisciplina({ ...editingDisciplina, permiteAulasGeminadas: checked })}
                              />
                              <Label htmlFor="edit-geminadas">Permite Aulas Geminadas?</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit">Salvar</Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                    )}
                    {podeExcluir && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(disciplina.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

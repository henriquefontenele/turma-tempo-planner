import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Disciplina, Professor } from '@/types';
import { Plus, Trash, Edit } from 'lucide-react';

interface ProfessoresTabProps {
  professores: Professor[];
  disciplinas: Disciplina[];
  onProfessoresChange: (professores: Professor[]) => void;
}

export function ProfessoresTab({ professores, disciplinas, onProfessoresChange }: ProfessoresTabProps) {
  const { hasPermissao } = useAuth();
  const podeCriar = hasPermissao('criar_professores');
  const podeEditar = hasPermissao('editar_professores');
  const podeExcluir = hasPermissao('excluir_professores');
  const [formData, setFormData] = useState({
    nome: '',
    disciplinas: [] as string[],
    horasManha: 0,
    horasTarde: 0,
    horasNoite: 0,
    diasIndisponiveis: [] as string[],
  });
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do professor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.disciplinas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma disciplina",
        variant: "destructive",
      });
      return;
    }

    const novoProfessor: Professor = {
      id: Date.now().toString(),
      nome: formData.nome.trim(),
      disciplinas: formData.disciplinas,
      horasManha: formData.horasManha,
      horasTarde: formData.horasTarde,
      horasNoite: formData.horasNoite,
      diasIndisponiveis: formData.diasIndisponiveis,
    };

    onProfessoresChange([...professores, novoProfessor]);
    setFormData({
      nome: '',
      disciplinas: [],
      horasManha: 0,
      horasTarde: 0,
      horasNoite: 0,
      diasIndisponiveis: [],
    });
    
    toast({
      title: "Sucesso",
      description: "Professor cadastrado com sucesso!",
    });
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProfessor) return;

    if (!editingProfessor.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do professor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingProfessor.disciplinas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma disciplina",
        variant: "destructive",
      });
      return;
    }

    const professoresAtualizados = professores.map(p => 
      p.id === editingProfessor.id ? editingProfessor : p
    );

    onProfessoresChange(professoresAtualizados);
    setIsEditModalOpen(false);
    setEditingProfessor(null);
    
    toast({
      title: "Sucesso",
      description: "Professor atualizado com sucesso!",
    });
  };

  const handleEditDisciplinaChange = (disciplinaId: string, checked: boolean) => {
    if (!editingProfessor) return;
    
    if (checked) {
      setEditingProfessor({
        ...editingProfessor,
        disciplinas: [...editingProfessor.disciplinas, disciplinaId]
      });
    } else {
      setEditingProfessor({
        ...editingProfessor,
        disciplinas: editingProfessor.disciplinas.filter(id => id !== disciplinaId)
      });
    }
  };

  const handleEditDiaIndisponivelChange = (dia: string, checked: boolean) => {
    if (!editingProfessor) return;
    
    if (checked) {
      setEditingProfessor({
        ...editingProfessor,
        diasIndisponiveis: [...editingProfessor.diasIndisponiveis, dia]
      });
    } else {
      setEditingProfessor({
        ...editingProfessor,
        diasIndisponiveis: editingProfessor.diasIndisponiveis.filter(d => d !== dia)
      });
    }
  };

  const handleDelete = (id: string) => {
    onProfessoresChange(professores.filter(p => p.id !== id));
    toast({
      title: "Sucesso",
      description: "Professor removido com sucesso!",
    });
  };

  const handleDisciplinaChange = (disciplinaId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, disciplinas: [...formData.disciplinas, disciplinaId] });
    } else {
      setFormData({ ...formData, disciplinas: formData.disciplinas.filter(id => id !== disciplinaId) });
    }
  };

  const handleDiaIndisponivelChange = (dia: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, diasIndisponiveis: [...formData.diasIndisponiveis, dia] });
    } else {
      setFormData({ ...formData, diasIndisponiveis: formData.diasIndisponiveis.filter(d => d !== dia) });
    }
  };

  return (
    <div className="space-y-6">
      {podeCriar && (
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Professor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nome">Nome do Professor</Label>
                <Input
                  id="nome"
                  placeholder="Digite o nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div>
                <Label>Disciplinas que Leciona</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {disciplinas.length === 0 ? (
                    <p className="text-sm text-gray-500">Cadastre disciplinas primeiro</p>
                  ) : (
                    disciplinas.map((disciplina) => (
                      <div key={disciplina.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`disc-${disciplina.id}`}
                          checked={formData.disciplinas.includes(disciplina.id)}
                          onCheckedChange={(checked) => handleDisciplinaChange(disciplina.id, !!checked)}
                        />
                        <Label htmlFor={`disc-${disciplina.id}`} className="text-sm">{disciplina.nome}</Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Segure Ctrl para selecionar múltiplas</p>
              </div>
            </div>

            <div>
              <Label>Horas/Semana por Turno</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="manha" className="text-sm">Manhã</Label>
                  <Input
                    id="manha"
                    type="number"
                    min="0"
                    value={formData.horasManha}
                    onChange={(e) => setFormData({ ...formData, horasManha: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="tarde" className="text-sm">Tarde</Label>
                  <Input
                    id="tarde"
                    type="number"
                    min="0"
                    value={formData.horasTarde}
                    onChange={(e) => setFormData({ ...formData, horasTarde: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="noite" className="text-sm">Noite</Label>
                  <Input
                    id="noite"
                    type="number"
                    min="0"
                    value={formData.horasNoite}
                    onChange={(e) => setFormData({ ...formData, horasNoite: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Dias Indisponíveis</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dia-${dia}`}
                      checked={formData.diasIndisponiveis.includes(dia)}
                      onCheckedChange={(checked) => handleDiaIndisponivelChange(dia, !!checked)}
                    />
                    <Label htmlFor={`dia-${dia}`} className="text-sm">{dia}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Professor
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Professores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {professores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum professor cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {professores.map((professor) => (
                <div key={professor.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-lg">{professor.nome}</h4>
                    <div className="flex gap-2">
                      {podeEditar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(professor)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      )}
                      {podeExcluir && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(professor.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Disciplinas:</strong> {professor.disciplinas.map(id => 
                        disciplinas.find(d => d.id === id)?.nome
                      ).join(', ')}
                    </div>
                    <div>
                      <strong>Horas:</strong> Manhã: {professor.horasManha}h, Tarde: {professor.horasTarde}h, Noite: {professor.horasNoite}h
                    </div>
                    {professor.diasIndisponiveis.length > 0 && (
                      <div className="md:col-span-2">
                        <strong>Dias indisponíveis:</strong> {professor.diasIndisponiveis.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          
          {editingProfessor && (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="edit-nome">Nome do Professor</Label>
                  <Input
                    id="edit-nome"
                    placeholder="Digite o nome completo"
                    value={editingProfessor.nome}
                    onChange={(e) => setEditingProfessor({
                      ...editingProfessor,
                      nome: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label>Disciplinas que Leciona</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {disciplinas.length === 0 ? (
                      <p className="text-sm text-gray-500">Cadastre disciplinas primeiro</p>
                    ) : (
                      disciplinas.map((disciplina) => (
                        <div key={disciplina.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-disc-${disciplina.id}`}
                            checked={editingProfessor.disciplinas.includes(disciplina.id)}
                            onCheckedChange={(checked) => handleEditDisciplinaChange(disciplina.id, !!checked)}
                          />
                          <Label htmlFor={`edit-disc-${disciplina.id}`} className="text-sm">{disciplina.nome}</Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label>Horas/Semana por Turno</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="edit-manha" className="text-sm">Manhã</Label>
                    <Input
                      id="edit-manha"
                      type="number"
                      min="0"
                      value={editingProfessor.horasManha}
                      onChange={(e) => setEditingProfessor({
                        ...editingProfessor,
                        horasManha: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-tarde" className="text-sm">Tarde</Label>
                    <Input
                      id="edit-tarde"
                      type="number"
                      min="0"
                      value={editingProfessor.horasTarde}
                      onChange={(e) => setEditingProfessor({
                        ...editingProfessor,
                        horasTarde: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-noite" className="text-sm">Noite</Label>
                    <Input
                      id="edit-noite"
                      type="number"
                      min="0"
                      value={editingProfessor.horasNoite}
                      onChange={(e) => setEditingProfessor({
                        ...editingProfessor,
                        horasNoite: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Dias Indisponíveis</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {diasSemana.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-dia-${dia}`}
                        checked={editingProfessor.diasIndisponiveis.includes(dia)}
                        onCheckedChange={(checked) => handleEditDiaIndisponivelChange(dia, !!checked)}
                      />
                      <Label htmlFor={`edit-dia-${dia}`} className="text-sm">{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

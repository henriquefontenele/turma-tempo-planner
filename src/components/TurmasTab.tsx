
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Disciplina, Turma, Escola } from '@/types';
import { Plus, Trash, Edit } from 'lucide-react';

interface TurmasTabProps {
  turmas: Turma[];
  disciplinas: Disciplina[];
  escolas: Escola[];
  onTurmasChange: (turmas: Turma[]) => void;
}

export function TurmasTab({ turmas, disciplinas, escolas, onTurmasChange }: TurmasTabProps) {
  const [formData, setFormData] = useState({
    nome: '',
    serie: '',
    turno: '' as 'matutino' | 'vespertino' | 'noturno' | '',
    disciplinas: [] as string[],
    escolaId: '',
    vagas: 30,
  });
  
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.serie || !formData.turno || !formData.escolaId) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
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

    if (formData.vagas <= 0 || formData.vagas > 50) {
      toast({
        title: "Erro",
        description: "O número de vagas deve ser entre 1 e 50",
        variant: "destructive",
      });
      return;
    }

    const novaTurma: Turma = {
      id: Date.now().toString(),
      nome: formData.nome.trim(),
      serie: formData.serie,
      turno: formData.turno,
      disciplinas: formData.disciplinas,
      escolaId: formData.escolaId,
      vagas: formData.vagas,
      vagasOcupadas: 0,
    };

    onTurmasChange([...turmas, novaTurma]);
    setFormData({ nome: '', serie: '', turno: '', disciplinas: [], escolaId: '', vagas: 30 });
    
    toast({
      title: "Sucesso",
      description: "Turma cadastrada com sucesso!",
    });
  };

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTurma) return;

    if (!editingTurma.nome.trim() || !editingTurma.serie || !editingTurma.turno || !editingTurma.escolaId) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      });
      return;
    }

    if (editingTurma.disciplinas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma disciplina",
        variant: "destructive",
      });
      return;
    }

    if ((editingTurma.vagas || 0) <= 0 || (editingTurma.vagas || 0) > 50) {
      toast({
        title: "Erro",
        description: "O número de vagas deve ser entre 1 e 50",
        variant: "destructive",
      });
      return;
    }

    const turmasAtualizadas = turmas.map(t => 
      t.id === editingTurma.id ? editingTurma : t
    );
    
    onTurmasChange(turmasAtualizadas);
    setIsEditDialogOpen(false);
    setEditingTurma(null);
    
    toast({
      title: "Sucesso",
      description: "Turma atualizada com sucesso!",
    });
  };

  const handleDelete = (id: string) => {
    onTurmasChange(turmas.filter(t => t.id !== id));
    toast({
      title: "Sucesso",
      description: "Turma removida com sucesso!",
    });
  };

  const handleDisciplinaChange = (disciplinaId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, disciplinas: [...formData.disciplinas, disciplinaId] });
    } else {
      setFormData({ ...formData, disciplinas: formData.disciplinas.filter(id => id !== disciplinaId) });
    }
  };

  const handleEditDisciplinaChange = (disciplinaId: string, checked: boolean) => {
    if (!editingTurma) return;
    
    if (checked) {
      setEditingTurma({ 
        ...editingTurma, 
        disciplinas: [...editingTurma.disciplinas, disciplinaId] 
      });
    } else {
      setEditingTurma({ 
        ...editingTurma, 
        disciplinas: editingTurma.disciplinas.filter(id => id !== disciplinaId) 
      });
    }
  };

  const escolasAtivas = escolas.filter(e => e.ativa);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Turma</Label>
                <Input
                  id="nome"
                  placeholder="Ex: 1º Ano A"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="serie">Série/Ano</Label>
                <Select value={formData.serie} onValueChange={(value) => setFormData({ ...formData, serie: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1ano">1º Ano</SelectItem>
                    <SelectItem value="2ano">2º Ano</SelectItem>
                    <SelectItem value="3ano">3º Ano</SelectItem>
                    <SelectItem value="4ano">4º Ano</SelectItem>
                    <SelectItem value="5ano">5º Ano</SelectItem>
                    <SelectItem value="6ano">6º Ano</SelectItem>
                    <SelectItem value="7ano">7º Ano</SelectItem>
                    <SelectItem value="8ano">8º Ano</SelectItem>
                    <SelectItem value="9ano">9º Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="turno">Turno</Label>
                <Select value={formData.turno} onValueChange={(value: any) => setFormData({ ...formData, turno: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                    <SelectItem value="noturno">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vagas">Vagas</Label>
                <Input
                  id="vagas"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.vagas}
                  onChange={(e) => setFormData({ ...formData, vagas: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Escola</Label>
              <Select value={formData.escolaId} onValueChange={(value) => setFormData({ ...formData, escolaId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  {escolasAtivas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Disciplinas da Turma</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {disciplinas.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full">Cadastre disciplinas primeiro</p>
                ) : (
                  disciplinas.map((disciplina) => (
                    <div key={disciplina.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`turma-disc-${disciplina.id}`}
                        checked={formData.disciplinas.includes(disciplina.id)}
                        onCheckedChange={(checked) => handleDisciplinaChange(disciplina.id, !!checked)}
                      />
                      <Label htmlFor={`turma-disc-${disciplina.id}`} className="text-sm">{disciplina.nome}</Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button type="submit" className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Turma
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Turmas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma turma cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {turmas.map((turma) => {
                const escola = escolas.find(e => e.id === turma.escolaId);
                return (
                  <div key={turma.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-lg">{turma.nome}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(turma)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(turma.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Série:</strong> {turma.serie} | <strong>Turno:</strong> {turma.turno}
                      </div>
                      <div>
                        <strong>Escola:</strong> {escola?.nome || 'N/A'}
                      </div>
                      <div>
                        <strong>Vagas:</strong> {(turma.vagasOcupadas || 0)} / {turma.vagas || 0}
                      </div>
                      <div>
                        <strong>Disciplinas:</strong> {turma.disciplinas.map(id => 
                          disciplinas.find(d => d.id === id)?.nome
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          {editingTurma && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome da Turma</Label>
                  <Input
                    id="edit-nome"
                    placeholder="Ex: 1º Ano A"
                    value={editingTurma.nome}
                    onChange={(e) => setEditingTurma({ ...editingTurma, nome: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-serie">Série/Ano</Label>
                  <Select value={editingTurma.serie} onValueChange={(value) => setEditingTurma({ ...editingTurma, serie: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1ano">1º Ano</SelectItem>
                      <SelectItem value="2ano">2º Ano</SelectItem>
                      <SelectItem value="3ano">3º Ano</SelectItem>
                      <SelectItem value="4ano">4º Ano</SelectItem>
                      <SelectItem value="5ano">5º Ano</SelectItem>
                      <SelectItem value="6ano">6º Ano</SelectItem>
                      <SelectItem value="7ano">7º Ano</SelectItem>
                      <SelectItem value="8ano">8º Ano</SelectItem>
                      <SelectItem value="9ano">9º Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-turno">Turno</Label>
                  <Select value={editingTurma.turno} onValueChange={(value: any) => setEditingTurma({ ...editingTurma, turno: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matutino">Matutino</SelectItem>
                      <SelectItem value="vespertino">Vespertino</SelectItem>
                      <SelectItem value="noturno">Noturno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-vagas">Vagas</Label>
                  <Input
                    id="edit-vagas"
                    type="number"
                    min="1"
                    max="50"
                    value={editingTurma.vagas || 0}
                    onChange={(e) => setEditingTurma({ ...editingTurma, vagas: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Escola</Label>
                <Select value={editingTurma.escolaId} onValueChange={(value) => setEditingTurma({ ...editingTurma, escolaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolasAtivas.map((escola) => (
                      <SelectItem key={escola.id} value={escola.id}>
                        {escola.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Disciplinas da Turma</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {disciplinas.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-full">Cadastre disciplinas primeiro</p>
                  ) : (
                    disciplinas.map((disciplina) => (
                      <div key={disciplina.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-disc-${disciplina.id}`}
                          checked={editingTurma.disciplinas.includes(disciplina.id)}
                          onCheckedChange={(checked) => handleEditDisciplinaChange(disciplina.id, !!checked)}
                        />
                        <Label htmlFor={`edit-disc-${disciplina.id}`} className="text-sm">{disciplina.nome}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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

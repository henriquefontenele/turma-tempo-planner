
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Disciplina, Turma } from '@/types';
import { Plus, Trash } from 'lucide-react';

interface TurmasTabProps {
  turmas: Turma[];
  disciplinas: Disciplina[];
  onTurmasChange: (turmas: Turma[]) => void;
}

export function TurmasTab({ turmas, disciplinas, onTurmasChange }: TurmasTabProps) {
  const [formData, setFormData] = useState({
    nome: '',
    serie: '',
    turno: '' as 'matutino' | 'vespertino' | 'noturno' | '',
    disciplinas: [] as string[],
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.serie || !formData.turno) {
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

    const novaTurma: Turma = {
      id: Date.now().toString(),
      nome: formData.nome.trim(),
      serie: formData.serie,
      turno: formData.turno,
      disciplinas: formData.disciplinas,
    };

    onTurmasChange([...turmas, novaTurma]);
    setFormData({ nome: '', serie: '', turno: '', disciplinas: [] });
    
    toast({
      title: "Sucesso",
      description: "Turma cadastrada com sucesso!",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-xs text-gray-500 mt-1">Segure Ctrl para selecionar múltiplas disciplinas</p>
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
              {turmas.map((turma) => (
                <div key={turma.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-lg">{turma.nome}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(turma.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Série:</strong> {turma.serie} | <strong>Turno:</strong> {turma.turno}
                    </div>
                    <div>
                      <strong>Disciplinas:</strong> {turma.disciplinas.map(id => 
                        disciplinas.find(d => d.id === id)?.nome
                      ).join(', ')}
                    </div>
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

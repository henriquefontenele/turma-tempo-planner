
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Disciplina, Professor } from '@/types';
import { Plus, Trash } from 'lucide-react';

interface ProfessoresTabProps {
  professores: Professor[];
  disciplinas: Disciplina[];
  onProfessoresChange: (professores: Professor[]) => void;
}

export function ProfessoresTab({ professores, disciplinas, onProfessoresChange }: ProfessoresTabProps) {
  const [formData, setFormData] = useState({
    nome: '',
    disciplinas: [] as string[],
    horasMatutino: 0,
    horasVespertino: 0,
    horasNoturno: 0,
    diasIndisponiveis: [] as string[],
  });
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
      horasMatutino: formData.horasMatutino,
      horasVespertino: formData.horasVespertino,
      horasNoturno: formData.horasNoturno,
      diasIndisponiveis: formData.diasIndisponiveis,
    };

    onProfessoresChange([...professores, novoProfessor]);
    setFormData({
      nome: '',
      disciplinas: [],
      horasMatutino: 0,
      horasVespertino: 0,
      horasNoturno: 0,
      diasIndisponiveis: [],
    });
    
    toast({
      title: "Sucesso",
      description: "Professor cadastrado com sucesso!",
    });
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
                  <Label htmlFor="matutino" className="text-sm">Matutino</Label>
                  <Input
                    id="matutino"
                    type="number"
                    min="0"
                    value={formData.horasMatutino}
                    onChange={(e) => setFormData({ ...formData, horasMatutino: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="vespertino" className="text-sm">Vespertino</Label>
                  <Input
                    id="vespertino"
                    type="number"
                    min="0"
                    value={formData.horasVespertino}
                    onChange={(e) => setFormData({ ...formData, horasVespertino: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="noturno" className="text-sm">Noturno</Label>
                  <Input
                    id="noturno"
                    type="number"
                    min="0"
                    value={formData.horasNoturno}
                    onChange={(e) => setFormData({ ...formData, horasNoturno: parseInt(e.target.value) || 0 })}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(professor.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Disciplinas:</strong> {professor.disciplinas.map(id => 
                        disciplinas.find(d => d.id === id)?.nome
                      ).join(', ')}
                    </div>
                    <div>
                      <strong>Horas:</strong> Mat: {professor.horasMatutino}h, Vesp: {professor.horasVespertino}h, Not: {professor.horasNoturno}h
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
    </div>
  );
}

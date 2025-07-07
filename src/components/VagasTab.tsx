
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Escola, Turma } from '@/types';
import { Users, Save } from 'lucide-react';

interface VagasTabProps {
  escolas: Escola[];
  turmas: Turma[];
  onTurmasChange: (turmas: Turma[]) => void;
}

export function VagasTab({ escolas, turmas, onTurmasChange }: VagasTabProps) {
  const { toast } = useToast();

  const handleVagasChange = (turmaId: string, vagas: number) => {
    onTurmasChange(turmas.map(t => 
      t.id === turmaId 
        ? { ...t, vagas, vagasOcupadas: t.vagasOcupadas || 0 }
        : t
    ));
  };

  const handleEscolaChange = (turmaId: string, escolaId: string) => {
    onTurmasChange(turmas.map(t => 
      t.id === turmaId ? { ...t, escolaId } : t
    ));
  };

  const salvarConfiguracoes = () => {
    const turmasSemEscola = turmas.filter(t => !t.escolaId);
    const turmasSemVagas = turmas.filter(t => !t.vagas || t.vagas <= 0);

    if (turmasSemEscola.length > 0) {
      toast({
        title: "Atenção",
        description: `${turmasSemEscola.length} turma(s) não tem escola associada`,
        variant: "destructive",
      });
      return;
    }

    if (turmasSemVagas.length > 0) {
      toast({
        title: "Atenção", 
        description: `${turmasSemVagas.length} turma(s) não tem vagas configuradas`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Configurações de vagas salvas com sucesso!",
    });
  };

  const escolasAtivas = escolas.filter(e => e.ativa);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Vagas das Turmas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Cadastre turmas primeiro na aba "Turmas"
            </p>
          ) : escolasAtivas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Cadastre escolas ativas primeiro na aba "Escolas"
            </p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {turmas.map((turma) => (
                  <div key={turma.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-lg">{turma.nome}</h4>
                      <span className="text-sm text-gray-500">
                        {turma.serie} - {turma.turno}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Escola</Label>
                        <Select 
                          value={turma.escolaId || ''} 
                          onValueChange={(value) => handleEscolaChange(turma.id, value)}
                        >
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
                        <Label>Quantidade de Vagas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="Ex: 30"
                          value={turma.vagas || ''}
                          onChange={(e) => handleVagasChange(turma.id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {turma.vagasOcupadas && turma.vagas && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Vagas Ocupadas:</strong> {turma.vagasOcupadas} / {turma.vagas}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(turma.vagasOcupadas / turma.vagas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={salvarConfiguracoes} className="bg-blue-500 hover:bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

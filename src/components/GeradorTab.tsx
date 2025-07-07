import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Disciplina, Professor, Turma, Configuracoes, HorarioGerado, ErroGeracao } from '@/types';
import { gerarHorarios } from '@/utils/horarioGenerator';
import { Settings, Trash2 } from 'lucide-react';

interface GeradorTabProps {
  disciplinas: Disciplina[];
  professores: Professor[];
  turmas: Turma[];
  configuracoes: Configuracoes;
  onHorariosGerados: (horarios: HorarioGerado[]) => void;
}

export function GeradorTab({ 
  disciplinas, 
  professores, 
  turmas, 
  configuracoes, 
  onHorariosGerados 
}: GeradorTabProps) {
  const [gerando, setGerando] = useState(false);
  const [erros, setErros] = useState<ErroGeracao[]>([]);
  const { toast } = useToast();

  const verificarStatus = () => {
    const problemas = [];
    
    if (disciplinas.length === 0) problemas.push('Disciplinas: 0');
    if (professores.length === 0) problemas.push('Professores: 0');
    if (turmas.length === 0) problemas.push('Turmas: 0');
    
    return problemas;
  };

  const handleGerar = async () => {
    const problemas = verificarStatus();
    
    if (problemas.length > 0) {
      toast({
        title: "Erro",
        description: "Complete o cadastro para gerar horários",
        variant: "destructive",
      });
      return;
    }

    setGerando(true);
    setErros([]);
    
    try {
      console.log('Iniciando geração de horários...');
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultado = gerarHorarios(turmas, disciplinas, professores, configuracoes);
      
      console.log('Resultado da geração:', resultado);
      
      if (resultado.erros.length > 0) {
        setErros(resultado.erros);
        toast({
          title: "Avisos na Geração",
          description: `${resultado.erros.length} problema(s) encontrado(s)`,
          variant: "destructive",
        });
      }
      
      if (resultado.horarios.length > 0) {
        onHorariosGerados(resultado.horarios);
        toast({
          title: "Sucesso",
          description: `${resultado.horarios.length} horário(s) gerado(s) com sucesso!`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar nenhum horário",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Erro na geração:', error);
      toast({
        title: "Erro",
        description: "Erro interno durante a geração",
        variant: "destructive",
      });
    } finally {
      setGerando(false);
    }
  };

  const handleLimpar = () => {
    onHorariosGerados([]);
    setErros([]);
    toast({
      title: "Sucesso",
      description: "Horários limpos com sucesso!",
    });
  };

  const problemas = verificarStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador Automático de Horários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg text-center ${disciplinas.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="text-2xl font-bold">{disciplinas.length}</div>
                <div className="text-sm">Disciplinas</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${professores.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="text-2xl font-bold">{professores.length}</div>
                <div className="text-sm">Professores</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${turmas.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="text-2xl font-bold">{turmas.length}</div>
                <div className="text-sm">Turmas</div>
              </div>
              <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-center">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm">Turnos</div>
              </div>
            </div>

            {problemas.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Complete o cadastro para gerar horários:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {problemas.map((problema, index) => (
                      <li key={index}>{problema}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleGerar}
                disabled={gerando || problemas.length > 0}
                className="bg-green-500 hover:bg-green-600 px-8 py-3 text-lg"
              >
                <Settings className={`w-5 h-5 mr-2 ${gerando ? 'animate-spin' : ''}`} />
                {gerando ? 'Gerando Horários...' : 'Gerar Horários Automaticamente'}
              </Button>
              
              <Button
                onClick={handleLimpar}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-3"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Limpar Horários
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {erros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Erros e Avisos na Geração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {erros.map((erro, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <strong>{erro.tipo.replace(/_/g, ' ').toUpperCase()}:</strong> {erro.mensagem}
                    {erro.detalhes && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">Ver detalhes</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(erro.detalhes, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

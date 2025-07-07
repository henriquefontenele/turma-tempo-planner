
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Configuracoes } from '@/types';

interface ConfigTabProps {
  configuracoes: Configuracoes;
  onConfiguracoesChange: (config: Configuracoes) => void;
}

export function ConfigTab({ configuracoes, onConfiguracoesChange }: ConfigTabProps) {
  const updateTurno = (turno: keyof Configuracoes, field: string, value: string | number) => {
    onConfiguracoesChange({
      ...configuracoes,
      [turno]: {
        ...configuracoes[turno],
        [field]: value,
      },
    });
  };

  const regras = [
    'Aulas geminadas: máximo 2 aulas seguidas da mesma disciplina por dia',
    'Duração: cada aula tem 1 hora de duração',
    'Otimização: sistema prioriza preencher todos os dias com aulas',
    'Disponibilidade: respeita dias indisponíveis dos professores',
    'Distribuição: evita dias com poucas aulas (2-3 aulas)',
    'Horários: configuráveis por turno com intervalos opcionais',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Turno Matutino */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-4">Turno Matutino</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="mat-inicio" className="text-sm">Início das aulas</Label>
                  <Input
                    id="mat-inicio"
                    type="time"
                    value={configuracoes.matutino.inicioAulas}
                    onChange={(e) => updateTurno('matutino', 'inicioAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mat-fim" className="text-sm">Fim das aulas</Label>
                  <Input
                    id="mat-fim"
                    type="time"
                    value={configuracoes.matutino.fimAulas}
                    onChange={(e) => updateTurno('matutino', 'fimAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mat-intervalo" className="text-sm">Intervalo (opcional)</Label>
                  <Input
                    id="mat-intervalo"
                    placeholder="09:30-09:50"
                    value={configuracoes.matutino.intervalo}
                    onChange={(e) => updateTurno('matutino', 'intervalo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mat-aulas" className="text-sm">Aulas por dia</Label>
                  <Input
                    id="mat-aulas"
                    type="number"
                    min="1"
                    max="10"
                    value={configuracoes.matutino.aulasPorDia}
                    onChange={(e) => updateTurno('matutino', 'aulasPorDia', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            </div>

            {/* Turno Vespertino */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-4">Turno Vespertino</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="vesp-inicio" className="text-sm">Início das aulas</Label>
                  <Input
                    id="vesp-inicio"
                    type="time"
                    value={configuracoes.vespertino.inicioAulas}
                    onChange={(e) => updateTurno('vespertino', 'inicioAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vesp-fim" className="text-sm">Fim das aulas</Label>
                  <Input
                    id="vesp-fim"
                    type="time"
                    value={configuracoes.vespertino.fimAulas}
                    onChange={(e) => updateTurno('vespertino', 'fimAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vesp-intervalo" className="text-sm">Intervalo (opcional)</Label>
                  <Input
                    id="vesp-intervalo"
                    placeholder="15:30-15:50"
                    value={configuracoes.vespertino.intervalo}
                    onChange={(e) => updateTurno('vespertino', 'intervalo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vesp-aulas" className="text-sm">Aulas por dia</Label>
                  <Input
                    id="vesp-aulas"
                    type="number"
                    min="1"
                    max="10"
                    value={configuracoes.vespertino.aulasPorDia}
                    onChange={(e) => updateTurno('vespertino', 'aulasPorDia', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
            </div>

            {/* Turno Noturno */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-4">Turno Noturno</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="not-inicio" className="text-sm">Início das aulas</Label>
                  <Input
                    id="not-inicio"
                    type="time"
                    value={configuracoes.noturno.inicioAulas}
                    onChange={(e) => updateTurno('noturno', 'inicioAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="not-fim" className="text-sm">Fim das aulas</Label>
                  <Input
                    id="not-fim"
                    type="time"
                    value={configuracoes.noturno.fimAulas}
                    onChange={(e) => updateTurno('noturno', 'fimAulas', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="not-intervalo" className="text-sm">Intervalo (opcional)</Label>
                  <Input
                    id="not-intervalo"
                    placeholder="20:30-20:40"
                    value={configuracoes.noturno.intervalo}
                    onChange={(e) => updateTurno('noturno', 'intervalo', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="not-aulas" className="text-sm">Aulas por dia</Label>
                  <Input
                    id="not-aulas"
                    type="number"
                    min="1"
                    max="8"
                    value={configuracoes.noturno.aulasPorDia}
                    onChange={(e) => updateTurno('noturno', 'aulasPorDia', parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <ul className="space-y-2">
              {regras.map((regra, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span className="text-sm text-gray-700">{regra}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

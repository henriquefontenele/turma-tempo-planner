
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { HorarioGerado, Turma } from '@/types';

interface HorariosTabProps {
  horarios: HorarioGerado[];
  turmas: Turma[];
}

export function HorariosTab({ horarios, turmas }: HorariosTabProps) {
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('todas');
  
  if (horarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grades de Horários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Nenhuma turma encontrada.</p>
            <p className="text-gray-400 mt-2">Gere os horários primeiro na aba "Gerador"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const horariosFiltrados = turmaSelecionada === 'todas' 
    ? horarios 
    : horarios.filter(h => h.turmaId === turmaSelecionada);

  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Grades de Horários
            <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} ({turma.turno})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {horariosFiltrados.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum horário encontrado para o filtro selecionado.
            </p>
          ) : (
            <div className="space-y-8">
              {horariosFiltrados.map((horario) => {
                const turma = turmas.find(t => t.id === horario.turmaId);
                if (!turma) return null;

                const horariosDisponiveis = Object.keys(horario.grade[diasSemana[0]] || {});

                return (
                  <div key={horario.turmaId} className="border rounded-lg p-6 bg-white shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      {turma.nome} - Turno {turma.turno.charAt(0).toUpperCase() + turma.turno.slice(1)}
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-center font-medium w-24">
                              Horário
                            </th>
                            {diasSemana.map((dia) => (
                              <th key={dia} className="border border-gray-300 p-3 text-center font-medium">
                                {dia}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {horariosDisponiveis.map((horarioAula) => (
                            <tr key={horarioAula} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50">
                                {horarioAula}
                              </td>
                              {diasSemana.map((dia) => {
                                const aula = horario.grade[dia]?.[horarioAula];
                                return (
                                  <td key={`${dia}-${horarioAula}`} className="border border-gray-300 p-2">
                                    {aula ? (
                                      <div className="text-center">
                                        <div className="font-medium text-sm text-blue-800">
                                          {aula.disciplinaNome}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {aula.professorNome}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-12 flex items-center justify-center text-gray-400 text-xs">
                                        -
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

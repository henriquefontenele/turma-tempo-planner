import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatorioTab } from './RelatorioTab';
import { RelatorioEADTab } from './RelatorioEADTab';
import { Escola, Turma, Estudante, Matricula, Disciplina, Professor, RegistroFrequencia, RegistroNota } from '@/types';

interface RelatoriosUnificadosTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
  disciplinas: Disciplina[];
  professores: Professor[];
  registrosFrequencia: RegistroFrequencia[];
  registrosNotas: RegistroNota[];
}

export function RelatoriosUnificadosTab(props: RelatoriosUnificadosTabProps) {
  const [activeTab, setActiveTab] = useState('academico');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">Visualize estatísticas acadêmicas e de cursos EAD</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="academico">
            📋 Acadêmico
          </TabsTrigger>
          <TabsTrigger value="ead">
            📈 EAD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academico" className="mt-6">
          <RelatorioTab {...props} />
        </TabsContent>

        <TabsContent value="ead" className="mt-6">
          <RelatorioEADTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

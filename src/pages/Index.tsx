
import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { DisciplinasTab } from '@/components/DisciplinasTab';
import { ProfessoresTab } from '@/components/ProfessoresTab';
import { TurmasTab } from '@/components/TurmasTab';
import { ConfigTab } from '@/components/ConfigTab';
import { GeradorTab } from '@/components/GeradorTab';
import { HorariosTab } from '@/components/HorariosTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Disciplina, Professor, Turma, Configuracoes, HorarioGerado } from '@/types';

const configuracoesPadrao: Configuracoes = {
  matutino: {
    inicioAulas: '07:00',
    fimAulas: '11:30',
    intervalo: '09:30-09:50',
    aulasPorDia: 5,
  },
  vespertino: {
    inicioAulas: '13:00',
    fimAulas: '17:30',
    intervalo: '15:30-15:50',
    aulasPorDia: 5,
  },
  noturno: {
    inicioAulas: '19:00',
    fimAulas: '22:30',
    intervalo: '20:30-20:40',
    aulasPorDia: 4,
  },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('disciplinas');
  const [disciplinas, setDisciplinas] = useLocalStorage<Disciplina[]>('disciplinas', []);
  const [professores, setProfessores] = useLocalStorage<Professor[]>('professores', []);
  const [turmas, setTurmas] = useLocalStorage<Turma[]>('turmas', []);
  const [configuracoes, setConfiguracoes] = useLocalStorage<Configuracoes>('configuracoes', configuracoesPadrao);
  const [horarios, setHorarios] = useLocalStorage<HorarioGerado[]>('horarios', []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              🎓 Sistema Avançado de Horários
            </h1>
            <p className="text-gray-600 mt-2">Geração automática de grades horárias escolares</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="transition-all duration-300">
          {activeTab === 'disciplinas' && (
            <DisciplinasTab 
              disciplinas={disciplinas} 
              onDisciplinasChange={setDisciplinas} 
            />
          )}
          
          {activeTab === 'professores' && (
            <ProfessoresTab 
              professores={professores}
              disciplinas={disciplinas}
              onProfessoresChange={setProfessores} 
            />
          )}
          
          {activeTab === 'turmas' && (
            <TurmasTab 
              turmas={turmas}
              disciplinas={disciplinas}
              onTurmasChange={setTurmas} 
            />
          )}
          
          {activeTab === 'config' && (
            <ConfigTab 
              configuracoes={configuracoes}
              onConfiguracoesChange={setConfiguracoes} 
            />
          )}
          
          {activeTab === 'gerador' && (
            <GeradorTab 
              disciplinas={disciplinas}
              professores={professores}
              turmas={turmas}
              configuracoes={configuracoes}
              onHorariosGerados={setHorarios}
            />
          )}
          
          {activeTab === 'horarios' && (
            <HorariosTab 
              horarios={horarios}
              turmas={turmas}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>Sistema de Horários Escolares - Geração Automática Inteligente</p>
          <p className="text-sm mt-1">
            📚 Disciplinas • 👨‍🏫 Professores • 🎓 Turmas • ⚙️ Configurações • 🎯 Gerador • 📅 Horários
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;


import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { DisciplinasTab } from '@/components/DisciplinasTab';
import { ProfessoresTab } from '@/components/ProfessoresTab';
import { TurmasTab } from '@/components/TurmasTab';
import { EscolasTab } from '@/components/EscolasTab';
import { MatriculaTab } from '@/components/MatriculaTab';
import { AlunosTab } from '@/components/AlunosTab';
import { ConfigTab } from '@/components/ConfigTab';
import { GeradorTab } from '@/components/GeradorTab';
import { HorariosTab } from '@/components/HorariosTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Disciplina, Professor, Turma, Escola, Estudante, Matricula, Configuracoes, HorarioGerado } from '@/types';

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
  const [escolas, setEscolas] = useLocalStorage<Escola[]>('escolas', []);
  const [estudantes, setEstudantes] = useLocalStorage<Estudante[]>('estudantes', []);
  const [matriculas, setMatriculas] = useLocalStorage<Matricula[]>('matriculas', []);
  const [configuracoes, setConfiguracoes] = useLocalStorage<Configuracoes>('configuracoes', configuracoesPadrao);
  const [horarios, setHorarios] = useLocalStorage<HorarioGerado[]>('horarios', []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="text-center flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Sistema Avançado de Horários e Matrículas
                  </h1>
                  <p className="text-gray-600 mt-1">Geração automática de grades horárias e sistema de matrícula escolar</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
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
                  escolas={escolas}
                  onTurmasChange={setTurmas} 
                />
              )}

              {activeTab === 'escolas' && (
                <EscolasTab 
                  escolas={escolas}
                  onEscolasChange={setEscolas} 
                />
              )}

              {activeTab === 'matricula' && (
                <MatriculaTab 
                  escolas={escolas}
                  turmas={turmas}
                  estudantes={estudantes}
                  matriculas={matriculas}
                  onEstudantesChange={setEstudantes}
                  onMatriculasChange={setMatriculas}
                  onTurmasChange={setTurmas}
                />
              )}

              {activeTab === 'alunos' && (
                <AlunosTab 
                  escolas={escolas}
                  turmas={turmas}
                  estudantes={estudantes}
                  matriculas={matriculas}
                  onEstudantesChange={setEstudantes}
                  onMatriculasChange={setMatriculas}
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
          <footer className="bg-white border-t">
            <div className="px-6 py-4 text-center text-gray-600">
              <p>Sistema de Horários Escolares e Matrículas - Gestão Completa</p>
              <p className="text-sm mt-1">
                📚 Disciplinas • 👨‍🏫 Professores • 🎓 Turmas • 🏫 Escolas • 📝 Matrícula • 👥 Alunos • ⚙️ Config • 🎯 Gerador • 📅 Horários
              </p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;

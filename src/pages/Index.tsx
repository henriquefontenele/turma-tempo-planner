
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { EscolasTab } from '@/components/EscolasTab';
import { TurmasTab } from '@/components/TurmasTab';
import { DisciplinasTab } from '@/components/DisciplinasTab';
import { ProfessoresTab } from '@/components/ProfessoresTab';
import { AlunosTab } from '@/components/AlunosTab';
import { HorariosTab } from '@/components/HorariosTab';
import { FrequenciaTab } from '@/components/FrequenciaTab';
import { GeradorTab } from '@/components/GeradorTab';
import { ConfigTab } from '@/components/ConfigTab';
import { MatriculaTab } from '@/components/MatriculaTab';
import { UsuariosTab } from '@/components/UsuariosTab';
import { Escola, Turma, Disciplina, Professor, Estudante, Matricula, Configuracoes, HorarioGerado, RegistroFrequencia } from '@/types';

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('escolas');

  const [escolas, setEscolas] = useLocalStorage<Escola[]>('escolas', []);
  const [turmas, setTurmas] = useLocalStorage<Turma[]>('turmas', []);
  const [disciplinas, setDisciplinas] = useLocalStorage<Disciplina[]>('disciplinas', []);
  const [professores, setProfessores] = useLocalStorage<Professor[]>('professores', []);
  const [estudantes, setEstudantes] = useLocalStorage<Estudante[]>('estudantes', []);
  const [matriculas, setMatriculas] = useLocalStorage<Matricula[]>('matriculas', []);
  const [configuracoes, setConfiguracoes] = useLocalStorage<Configuracoes>('configuracoes', {
    matutino: { inicioAulas: '07:00', fimAulas: '12:00', intervalo: '09:30-09:50', aulasPorDia: 5 },
    vespertino: { inicioAulas: '13:00', fimAulas: '18:00', intervalo: '15:30-15:50', aulasPorDia: 5 },
    noturno: { inicioAulas: '19:00', fimAulas: '23:00', intervalo: '21:00-21:15', aulasPorDia: 4 },
  });
  const [horariosGerados, setHorariosGerados] = useLocalStorage<HorarioGerado[]>('horarios-gerados', []);
  
  const [registrosFrequencia, setRegistrosFrequencia] = useLocalStorage<RegistroFrequencia[]>('registros-frequencia', []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'escolas':
        return <EscolasTab escolas={escolas} onEscolasChange={setEscolas} />;
      case 'turmas':
        return (
          <TurmasTab
            escolas={escolas}
            turmas={turmas}
            disciplinas={disciplinas}
            onTurmasChange={setTurmas}
          />
        );
      case 'disciplinas':
        return (
          <DisciplinasTab
            disciplinas={disciplinas}
            onDisciplinasChange={setDisciplinas}
          />
        );
      case 'professores':
        return (
          <ProfessoresTab
            disciplinas={disciplinas}
            professores={professores}
            onProfessoresChange={setProfessores}
          />
        );
      case 'alunos':
        return (
          <AlunosTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            onEstudantesChange={setEstudantes}
            onMatriculasChange={setMatriculas}
          />
        );
      case 'gerador':
        return (
          <GeradorTab
            disciplinas={disciplinas}
            professores={professores}
            turmas={turmas}
            configuracoes={configuracoes}
            onHorariosGerados={setHorariosGerados}
          />
        );
      case 'matricula':
        return (
          <MatriculaTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            onEstudantesChange={setEstudantes}
            onMatriculasChange={setMatriculas}
            onTurmasChange={setTurmas}
          />
        );
      case 'config':
        return (
          <ConfigTab
            configuracoes={configuracoes}
            onConfiguracoesChange={setConfiguracoes}
          />
        );
      case 'horarios':
        return (
          <HorariosTab
            horarios={horariosGerados}
            turmas={turmas}
          />
        );
      case 'frequencia':
        return (
          <FrequenciaTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            disciplinas={disciplinas}
            professores={professores}
            registrosFrequencia={registrosFrequencia}
            onRegistrosFrequenciaChange={setRegistrosFrequencia}
          />
        );
      case 'usuarios':
        return <UsuariosTab />;
      default:
        return <EscolasTab escolas={escolas} onEscolasChange={setEscolas} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-lg font-semibold">Sistema de Gestão Escolar</h1>
              {user && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Bem-vindo, {user.email}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

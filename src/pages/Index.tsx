
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreDoc, useFirestoreCollection } from '@/hooks/useFirestore';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { EscolasTab } from '@/components/EscolasTab';
import { TurmasTab } from '@/components/TurmasTab';
import { DisciplinasTab } from '@/components/DisciplinasTab';
import { ProfessoresTab } from '@/components/ProfessoresTab';
import { AlunosTab } from '@/components/AlunosTab';
import { HorariosTab } from '@/components/HorariosTab';
import { AcademicoTab } from '@/components/AcademicoTab';
import { NotasTab } from '@/components/NotasTab';
import { RelatorioTab } from '@/components/RelatorioTab';
import { GeradorTab } from '@/components/GeradorTab';
import { ConfigTab } from '@/components/ConfigTab';
import { MatriculaTab } from '@/components/MatriculaTab';
import { UsuariosTab } from '@/components/UsuariosTab';
import { PerfisTab } from '@/components/PerfisTab';
import { Dashboard } from '@/components/Dashboard';
import { CursosEADTab } from '@/components/CursosEADTab';
import { ModulosEADTab } from '@/components/ModulosEADTab';
import { AulasEADTab } from '@/components/AulasEADTab';
import { MatriculasEADTab } from '@/components/MatriculasEADTab';
import { RelatorioEADTab } from '@/components/RelatorioEADTab';
import { Escola, Turma, Disciplina, Professor, Estudante, Matricula, Configuracoes, HorarioGerado, RegistroFrequencia, RegistroNota } from '@/types';

// Mapeamento dos nomes das funcionalidades
const tabNames: Record<string, string> = {
  dashboard: 'Dashboard',
  escolas: 'Escolas',
  turmas: 'Turmas', 
  disciplinas: 'Disciplinas',
  professores: 'Professores',
  alunos: 'Alunos',
  gerador: 'Gerador de Horários',
  matricula: 'Matrícula',
  config: 'Turnos',
  horarios: 'Horários',
  academico: 'Frequência',
  notas: 'Notas',
  relatorio: 'Relatório',
  usuarios: 'Usuários',
  perfis: 'Perfis de Acesso',
  'cursos-ead': 'Cursos EAD',
  'modulos-ead': 'Módulos EAD',
  'aulas-ead': 'Aulas EAD',
  'matriculas-ead': 'Matrículas EAD',
  'relatorio-ead': 'Relatórios EAD'
};

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: escolas, addItem: addEscola, updateItem: updateEscola, deleteItem: deleteEscola } = useFirestoreCollection<Escola>('escolas', true);
  const { data: turmas, addItem: addTurma, updateItem: updateTurma, deleteItem: deleteTurma } = useFirestoreCollection<Turma>('turmas', true);
  const { data: disciplinas, addItem: addDisciplina, updateItem: updateDisciplina, deleteItem: deleteDisciplina } = useFirestoreCollection<Disciplina>('disciplinas', false);
  const { data: professores, addItem: addProfessor, updateItem: updateProfessor, deleteItem: deleteProfessor } = useFirestoreCollection<Professor>('professores', false);
  const { data: estudantes, addItem: addEstudante, updateItem: updateEstudante, deleteItem: deleteEstudante } = useFirestoreCollection<Estudante>('estudantes', true);
  const { data: matriculas, addItem: addMatricula, updateItem: updateMatricula, deleteItem: deleteMatricula } = useFirestoreCollection<Matricula>('matriculas', true);
  const { data: configuracoes, updateData: setConfiguracoes } = useFirestoreDoc<Configuracoes>('configuracoes', {
    manhã: { inicioAulas: '07:00', fimAulas: '12:00', intervalo: '09:30-09:50', aulasPorDia: 5 },
    tarde: { inicioAulas: '13:00', fimAulas: '18:00', intervalo: '15:30-15:50', aulasPorDia: 5 },
    noite: { inicioAulas: '19:00', fimAulas: '23:00', intervalo: '21:00-21:15', aulasPorDia: 4 },
  });
  const { data: horariosGerados, addItem: addHorario, updateItem: updateHorario, deleteItem: deleteHorario, setData: setHorariosGerados } = useFirestoreCollection<HorarioGerado>('horarios-gerados', true);
  const { data: registrosFrequencia, addItem: addRegistroFrequencia, updateItem: updateRegistroFrequencia, deleteItem: deleteRegistroFrequencia, setData: setRegistrosFrequencia } = useFirestoreCollection<RegistroFrequencia>('registros-frequencia', true);
  const { data: registrosNotas, addItem: addRegistroNota, updateItem: updateRegistroNota, deleteItem: deleteRegistroNota, setData: setRegistrosNotas } = useFirestoreCollection<RegistroNota>('registros-notas', true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Wrappers para manter compatibilidade com componentes existentes
  const handleEscolasChange = async (novasEscolas: Escola[]) => {
    // Identifica alterações e usa as funções corretas do Firestore
    const escolasAtuais = escolas;
    const escolasAdicionadas = novasEscolas.filter(nova => !escolasAtuais.find(atual => atual.id === nova.id));
    const escolasRemovidas = escolasAtuais.filter(atual => !novasEscolas.find(nova => nova.id === atual.id));
    const escolasAtualizadas = novasEscolas.filter(nova => {
      const atual = escolasAtuais.find(e => e.id === nova.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(nova);
    });

    for (const escola of escolasAdicionadas) {
      await addEscola(escola);
    }
    for (const escola of escolasRemovidas) {
      await deleteEscola(escola.id);
    }
    for (const escola of escolasAtualizadas) {
      await updateEscola(escola.id, escola);
    }
  };

  const handleDisciplinasChange = async (novasDisciplinas: Disciplina[]) => {
    const disciplinasAtuais = disciplinas;
    const disciplinasAdicionadas = novasDisciplinas.filter(nova => !disciplinasAtuais.find(atual => atual.id === nova.id));
    const disciplinasRemovidas = disciplinasAtuais.filter(atual => !novasDisciplinas.find(nova => nova.id === atual.id));
    const disciplinasAtualizadas = novasDisciplinas.filter(nova => {
      const atual = disciplinasAtuais.find(d => d.id === nova.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(nova);
    });

    for (const disciplina of disciplinasAdicionadas) {
      await addDisciplina(disciplina);
    }
    for (const disciplina of disciplinasRemovidas) {
      await deleteDisciplina(disciplina.id);
    }
    for (const disciplina of disciplinasAtualizadas) {
      await updateDisciplina(disciplina.id, disciplina);
    }
  };

  const handleTurmasChange = async (novasTurmas: Turma[]) => {
    const turmasAtuais = turmas;
    const turmasAdicionadas = novasTurmas.filter(nova => !turmasAtuais.find(atual => atual.id === nova.id));
    const turmasRemovidas = turmasAtuais.filter(atual => !novasTurmas.find(nova => nova.id === atual.id));
    const turmasAtualizadas = novasTurmas.filter(nova => {
      const atual = turmasAtuais.find(t => t.id === nova.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(nova);
    });

    for (const turma of turmasAdicionadas) {
      await addTurma(turma);
    }
    for (const turma of turmasRemovidas) {
      await deleteTurma(turma.id);
    }
    for (const turma of turmasAtualizadas) {
      await updateTurma(turma.id, turma);
    }
  };

  const handleProfessoresChange = async (novosProfessores: Professor[]) => {
    const professoresAtuais = professores;
    const professoresAdicionados = novosProfessores.filter(novo => !professoresAtuais.find(atual => atual.id === novo.id));
    const professoresRemovidos = professoresAtuais.filter(atual => !novosProfessores.find(novo => novo.id === atual.id));
    const professoresAtualizados = novosProfessores.filter(novo => {
      const atual = professoresAtuais.find(p => p.id === novo.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(novo);
    });

    for (const professor of professoresAdicionados) {
      await addProfessor(professor);
    }
    for (const professor of professoresRemovidos) {
      await deleteProfessor(professor.id);
    }
    for (const professor of professoresAtualizados) {
      await updateProfessor(professor.id, professor);
    }
  };

  const handleEstudantesChange = async (novosEstudantes: Estudante[]) => {
    const estudantesAtuais = estudantes;
    const estudantesAdicionados = novosEstudantes.filter(novo => !estudantesAtuais.find(atual => atual.id === novo.id));
    const estudantesRemovidos = estudantesAtuais.filter(atual => !novosEstudantes.find(novo => novo.id === atual.id));
    const estudantesAtualizados = novosEstudantes.filter(novo => {
      const atual = estudantesAtuais.find(e => e.id === novo.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(novo);
    });

    for (const estudante of estudantesAdicionados) {
      await addEstudante(estudante);
    }
    for (const estudante of estudantesRemovidos) {
      await deleteEstudante(estudante.id);
    }
    for (const estudante of estudantesAtualizados) {
      await updateEstudante(estudante.id, estudante);
    }
  };

  const handleMatriculasChange = async (novasMatriculas: Matricula[]) => {
    const matriculasAtuais = matriculas;
    const matriculasAdicionadas = novasMatriculas.filter(nova => !matriculasAtuais.find(atual => atual.id === nova.id));
    const matriculasRemovidas = matriculasAtuais.filter(atual => !novasMatriculas.find(nova => nova.id === atual.id));
    const matriculasAtualizadas = novasMatriculas.filter(nova => {
      const atual = matriculasAtuais.find(m => m.id === nova.id);
      return atual && JSON.stringify(atual) !== JSON.stringify(nova);
    });

    for (const matricula of matriculasAdicionadas) {
      await addMatricula(matricula);
    }
    for (const matricula of matriculasRemovidas) {
      await deleteMatricula(matricula.id);
    }
    for (const matricula of matriculasAtualizadas) {
      await updateMatricula(matricula.id, matricula);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            escolas={escolas}
            turmas={turmas}
            disciplinas={disciplinas}
            professores={professores}
            estudantes={estudantes}
            matriculas={matriculas}
            horariosGerados={horariosGerados}
            registrosFrequencia={registrosFrequencia}
            registrosNotas={registrosNotas}
            onNavigate={setActiveTab}
          />
        );
      case 'escolas':
        return <EscolasTab />;
      case 'turmas':
        return <TurmasTab />;
      case 'disciplinas':
        return <DisciplinasTab />;
      case 'professores':
        return (
          <ProfessoresTab
            disciplinas={disciplinas}
            professores={professores}
            onProfessoresChange={handleProfessoresChange}
          />
        );
      case 'alunos':
        return (
          <AlunosTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            onEstudantesChange={handleEstudantesChange}
            onMatriculasChange={handleMatriculasChange}
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
        return <MatriculaTab />;
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
      case 'academico':
        return (
          <AcademicoTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            disciplinas={disciplinas}
            professores={professores}
            registrosFrequencia={registrosFrequencia}
            onRegistrosFrequenciaChange={setRegistrosFrequencia}
            registrosNotas={registrosNotas}
            onRegistrosNotasChange={setRegistrosNotas}
          />
        );
      case 'notas':
        return (
          <NotasTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            disciplinas={disciplinas}
            professores={professores}
            registrosNotas={registrosNotas}
            onRegistrosNotasChange={setRegistrosNotas}
          />
        );
      case 'relatorio':
        return (
          <RelatorioTab
            escolas={escolas}
            turmas={turmas}
            estudantes={estudantes}
            matriculas={matriculas}
            disciplinas={disciplinas}
            professores={professores}
            registrosFrequencia={registrosFrequencia}
            registrosNotas={registrosNotas}
          />
        );
      case 'usuarios':
        return <UsuariosTab />;
      case 'perfis':
        return <PerfisTab />;
      case 'cursos-ead':
        return <CursosEADTab />;
      case 'modulos-ead': {
        console.debug('[Index] Rendering ModulosEADTab')
        return <ModulosEADTab />;
      }
      case 'aulas-ead':
        return <AulasEADTab />;
      case 'matriculas-ead':
        return <MatriculasEADTab />;
      case 'relatorio-ead':
        return <RelatorioEADTab />;
      default:
        return (
          <Dashboard
            escolas={escolas}
            turmas={turmas}
            disciplinas={disciplinas}
            professores={professores}
            estudantes={estudantes}
            matriculas={matriculas}
            horariosGerados={horariosGerados}
            registrosFrequencia={registrosFrequencia}
            registrosNotas={registrosNotas}
            onNavigate={setActiveTab}
          />
        );
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
              <h1 className="text-lg font-semibold">{tabNames[activeTab] || 'Sistema de Gestão Escolar'}</h1>
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

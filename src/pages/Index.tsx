
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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
import { Escola, Turma, Disciplina, Professor, Estudante, Matricula, Configuracoes, HorarioGerado, RegistroFrequencia, RegistroNota } from '@/types';

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('escolas');

  const { data: escolas, addItem: addEscola, updateItem: updateEscola, deleteItem: deleteEscola } = useFirestoreCollection<Escola>('escolas');
  const { data: turmas, addItem: addTurma, updateItem: updateTurma, deleteItem: deleteTurma } = useFirestoreCollection<Turma>('turmas');
  const { data: disciplinas, addItem: addDisciplina, updateItem: updateDisciplina, deleteItem: deleteDisciplina } = useFirestoreCollection<Disciplina>('disciplinas');
  const { data: professores, addItem: addProfessor, updateItem: updateProfessor, deleteItem: deleteProfessor } = useFirestoreCollection<Professor>('professores');
  const [estudantes, setEstudantes] = useLocalStorage<Estudante[]>('estudantes', []);
  const [matriculas, setMatriculas] = useLocalStorage<Matricula[]>('matriculas', []);
  const { data: configuracoes, updateData: setConfiguracoes } = useFirestoreDoc<Configuracoes>('configuracoes', {
    matutino: { inicioAulas: '07:00', fimAulas: '12:00', intervalo: '09:30-09:50', aulasPorDia: 5 },
    vespertino: { inicioAulas: '13:00', fimAulas: '18:00', intervalo: '15:30-15:50', aulasPorDia: 5 },
    noturno: { inicioAulas: '19:00', fimAulas: '23:00', intervalo: '21:00-21:15', aulasPorDia: 4 },
  });
  const [horariosGerados, setHorariosGerados] = useLocalStorage<HorarioGerado[]>('horarios-gerados', []);
  
  const [registrosFrequencia, setRegistrosFrequencia] = useLocalStorage<RegistroFrequencia[]>('registros-frequencia', []);
  const [registrosNotas, setRegistrosNotas] = useLocalStorage<RegistroNota[]>('registros-notas', []);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'escolas':
        return <EscolasTab escolas={escolas} onEscolasChange={handleEscolasChange} />;
      case 'turmas':
        return (
          <TurmasTab
            escolas={escolas}
            turmas={turmas}
            disciplinas={disciplinas}
            onTurmasChange={handleTurmasChange}
          />
        );
      case 'disciplinas':
        return (
          <DisciplinasTab
            disciplinas={disciplinas}
            onDisciplinasChange={handleDisciplinasChange}
          />
        );
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
            onTurmasChange={handleTurmasChange}
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
      default:
        return <EscolasTab escolas={escolas} onEscolasChange={handleEscolasChange} />;
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

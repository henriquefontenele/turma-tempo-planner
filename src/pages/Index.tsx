import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Navigation } from '@/components/Navigation';
import { EscolasTab } from '@/components/EscolasTab';
import { TurmasTab } from '@/components/TurmasTab';
import { DisciplinasTab } from '@/components/DisciplinasTab';
import { ProfessoresTab } from '@/components/ProfessoresTab';
import { AlunosTab } from '@/components/AlunosTab';
import { ConfiguracoesTab } from '@/components/ConfiguracoesTab';
import { HorariosTab } from '@/components/HorariosTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FrequenciaTab } from '@/components/FrequenciaTab';
import { Escola, Turma, Disciplina, Professor, Estudante, Matricula, Configuracoes, HorarioGerado, RegistroFrequencia } from '@/types';

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={logout} />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="escolas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="escolas">Escolas</TabsTrigger>
            <TabsTrigger value="turmas">Turmas</TabsTrigger>
            <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
            <TabsTrigger value="professores">Professores</TabsTrigger>
            <TabsTrigger value="alunos">Alunos</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          </TabsList>

          <TabsContent value="escolas">
            <EscolasTab 
              escolas={escolas} 
              onEscolasChange={setEscolas} 
            />
          </TabsContent>

          <TabsContent value="turmas">
            <TurmasTab
              escolas={escolas}
              turmas={turmas}
              disciplinas={disciplinas}
              onTurmasChange={setTurmas}
            />
          </TabsContent>

          <TabsContent value="disciplinas">
            <DisciplinasTab
              disciplinas={disciplinas}
              onDisciplinasChange={setDisciplinas}
            />
          </TabsContent>

          <TabsContent value="professores">
            <ProfessoresTab
              disciplinas={disciplinas}
              professores={professores}
              onProfessoresChange={setProfessores}
            />
          </TabsContent>

          <TabsContent value="alunos">
            <AlunosTab
              escolas={escolas}
              turmas={turmas}
              estudantes={estudantes}
              matriculas={matriculas}
              onEstudantesChange={setEstudantes}
              onMatriculasChange={setMatriculas}
            />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesTab
              configuracoes={configuracoes}
              onConfiguracoesChange={setConfiguracoes}
            />
          </TabsContent>

          <TabsContent value="horarios">
            <HorariosTab
              escolas={escolas}
              turmas={turmas}
              disciplinas={disciplinas}
              professores={professores}
              configuracoes={configuracoes}
              horariosGerados={horariosGerados}
              onHorariosGeradosChange={setHorariosGerados}
            />
          </TabsContent>

          <TabsContent value="frequencia">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


import { Disciplina, Professor, Turma, Configuracoes, HorarioGerado, ErroGeracao } from '@/types';

export function gerarHorarios(
  turmas: Turma[],
  disciplinas: Disciplina[],
  professores: Professor[],
  configuracoes: Configuracoes
): { horarios: HorarioGerado[], erros: ErroGeracao[] } {
  const horarios: HorarioGerado[] = [];
  const erros: ErroGeracao[] = [];
  
  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  
  // Mapa global de ocupação dos professores
  const ocupacaoProfessores: Map<string, Set<string>> = new Map();
  
  for (const turma of turmas) {
    console.log(`Gerando horário para turma: ${turma.nome}`);
    
    try {
      const horarioTurma = gerarHorarioTurma(
        turma, 
        disciplinas, 
        professores, 
        configuracoes, 
        ocupacaoProfessores
      );
      
      if (horarioTurma.erros.length > 0) {
        erros.push(...horarioTurma.erros);
      }
      
      if (horarioTurma.horario) {
        horarios.push(horarioTurma.horario);
      }
    } catch (error) {
      console.error(`Erro ao gerar horário para turma ${turma.nome}:`, error);
      erros.push({
        tipo: 'configuracao_invalida',
        mensagem: `Erro interno ao processar turma ${turma.nome}`,
        detalhes: error
      });
    }
  }
  
  return { horarios, erros };
}

function gerarHorarioTurma(
  turma: Turma,
  disciplinas: Disciplina[],
  professores: Professor[],
  configuracoes: Configuracoes,
  ocupacaoProfessores: Map<string, Set<string>>
): { horario: HorarioGerado | null, erros: ErroGeracao[] } {
  const erros: ErroGeracao[] = [];
  const config = configuracoes[turma.turno];
  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  
  // Inicializar grade horária
  const grade: any = {};
  const horarios = gerarHorariosDia(config);
  
  diasSemana.forEach(dia => {
    grade[dia] = {};
    horarios.forEach(horario => {
      grade[dia][horario] = null;
    });
  });
  
  // Calcular necessidades de aulas por disciplina
  const necessidadesAulas = new Map<string, number>();
  turma.disciplinas.forEach(disciplinaId => {
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    if (disciplina) {
      necessidadesAulas.set(disciplinaId, disciplina.cargaHorariaSemanal);
    }
  });
  
  // Alocar aulas por disciplina
  for (const [disciplinaId, aulasNecessarias] of necessidadesAulas) {
    const disciplina = disciplinas.find(d => d.id === disciplinaId);
    if (!disciplina) continue;
    
    const professoresDisponiveis = professores.filter(p => 
      p.disciplinas.includes(disciplinaId) && 
      (turma.turno === 'matutino' ? p.horasMatutino > 0 :
       turma.turno === 'vespertino' ? p.horasVespertino > 0 :
       p.horasNoturno > 0)
    );
    
    if (professoresDisponiveis.length === 0) {
      erros.push({
        tipo: 'sem_professor_disponivel',
        mensagem: `Nenhum professor disponível para a disciplina ${disciplina.nome} no turno ${turma.turno}`,
        detalhes: { disciplina: disciplina.nome, turma: turma.nome }
      });
      continue;
    }
    
    // Escolher professor com mais disponibilidade
    const professor = professoresDisponiveis.sort((a, b) => {
      const horasA = turma.turno === 'matutino' ? a.horasMatutino :
                     turma.turno === 'vespertino' ? a.horasVespertino : a.horasNoturno;
      const horasB = turma.turno === 'matutino' ? b.horasMatutino :
                     turma.turno === 'vespertino' ? b.horasVespertino : b.horasNoturno;
      return horasB - horasA;
    })[0];
    
    let aulasAlocadas = 0;
    
    // Tentar alocar aulas geminadas primeiro (se permitido)
    if (disciplina.permiteAulasGeminadas && aulasNecessarias >= 2) {
      aulasAlocadas += alocarAulasGeminadas(
        grade, disciplina, professor, turma, horarios, diasSemana, ocupacaoProfessores
      );
    }
    
    // Alocar aulas restantes individualmente
    const aulasRestantes = aulasNecessarias - aulasAlocadas;
    for (let i = 0; i < aulasRestantes; i++) {
      const alocou = alocarAulaIndividual(
        grade, disciplina, professor, turma, horarios, diasSemana, ocupacaoProfessores
      );
      
      if (alocou) {
        aulasAlocadas++;
      } else {
        erros.push({
          tipo: 'conflito_professor',
          mensagem: `Não foi possível alocar todas as aulas de ${disciplina.nome} para a turma ${turma.nome}`,
          detalhes: { 
            disciplina: disciplina.nome, 
            turma: turma.nome, 
            professor: professor.nome,
            aulasAlocadas,
            aulasNecessarias
          }
        });
        break;
      }
    }
    
    if (aulasAlocadas < aulasNecessarias) {
      erros.push({
        tipo: 'carga_horaria_insuficiente',
        mensagem: `Carga horária insuficiente para ${disciplina.nome} na turma ${turma.nome}. Alocadas: ${aulasAlocadas}/${aulasNecessarias}`,
        detalhes: { disciplina: disciplina.nome, turma: turma.nome, aulasAlocadas, aulasNecessarias }
      });
    }
  }
  
  const horario: HorarioGerado = {
    id: `horario_${turma.id}_${Date.now()}`,
    turmaId: turma.id,
    grade
  };
  
  return { horario, erros };
}

function gerarHorariosDia(config: any): string[] {
  const horarios: string[] = [];
  const inicio = new Date(`2000-01-01T${config.inicioAulas}:00`);
  const fim = new Date(`2000-01-01T${config.fimAulas}:00`);
  
  let atual = new Date(inicio);
  let aulaCount = 0;
  
  while (atual < fim && aulaCount < config.aulasPorDia) {
    const proximaHora = new Date(atual.getTime() + 60 * 60 * 1000);
    
    // Verificar se não conflita com intervalo
    if (config.intervalo && config.intervalo.includes('-')) {
      const [inicioIntervalo, fimIntervalo] = config.intervalo.split('-');
      const inicioInt = new Date(`2000-01-01T${inicioIntervalo}:00`);
      const fimInt = new Date(`2000-01-01T${fimIntervalo}:00`);
      
      if (atual >= inicioInt && atual < fimInt) {
        atual = new Date(fimInt);
        continue;
      }
    }
    
    horarios.push(atual.toTimeString().slice(0, 5));
    atual = proximaHora;
    aulaCount++;
  }
  
  return horarios;
}

function alocarAulasGeminadas(
  grade: any,
  disciplina: Disciplina,
  professor: Professor,
  turma: Turma,
  horarios: string[],
  diasSemana: string[],
  ocupacaoProfessores: Map<string, Set<string>>
): number {
  let aulasAlocadas = 0;
  const maxGeminadas = Math.floor(disciplina.cargaHorariaSemanal / 2);
  
  for (let geminada = 0; geminada < maxGeminadas; geminada++) {
    let alocouGeminada = false;
    
    for (const dia of diasSemana) {
      if (professor.diasIndisponiveis.includes(dia)) continue;
      
      // Verificar se já tem 2 aulas da mesma disciplina neste dia
      const aulasNoDia = Object.values(grade[dia]).filter(
        (aula: any) => aula?.disciplinaId === disciplina.id
      ).length;
      
      if (aulasNoDia >= 2) continue;
      
      for (let i = 0; i < horarios.length - 1; i++) {
        const horario1 = horarios[i];
        const horario2 = horarios[i + 1];
        
        const chave1 = `${dia}-${horario1}`;
        const chave2 = `${dia}-${horario2}`;
        
        if (!ocupacaoProfessores.has(professor.id)) {
          ocupacaoProfessores.set(professor.id, new Set());
        }
        
        const ocupacao = ocupacaoProfessores.get(professor.id)!;
        
        if (grade[dia][horario1] === null && 
            grade[dia][horario2] === null &&
            !ocupacao.has(chave1) &&
            !ocupacao.has(chave2)) {
          
          const aulaInfo = {
            disciplinaId: disciplina.id,
            professorId: professor.id,
            disciplinaNome: disciplina.nome,
            professorNome: professor.nome
          };
          
          grade[dia][horario1] = aulaInfo;
          grade[dia][horario2] = aulaInfo;
          
          ocupacao.add(chave1);
          ocupacao.add(chave2);
          
          aulasAlocadas += 2;
          alocouGeminada = true;
          break;
        }
      }
      
      if (alocouGeminada) break;
    }
    
    if (!alocouGeminada) break;
  }
  
  return aulasAlocadas;
}

function alocarAulaIndividual(
  grade: any,
  disciplina: Disciplina,
  professor: Professor,
  turma: Turma,
  horarios: string[],
  diasSemana: string[],
  ocupacaoProfessores: Map<string, Set<string>>
): boolean {
  if (!ocupacaoProfessores.has(professor.id)) {
    ocupacaoProfessores.set(professor.id, new Set());
  }
  
  const ocupacao = ocupacaoProfessores.get(professor.id)!;
  
  // Tentar distribuir uniformemente ao longo da semana
  for (const dia of diasSemana) {
    if (professor.diasIndisponiveis.includes(dia)) continue;
    
    // Verificar limite de aulas da disciplina por dia (máximo 2 se permite geminadas, 1 se não)
    const aulasNoDia = Object.values(grade[dia]).filter(
      (aula: any) => aula?.disciplinaId === disciplina.id
    ).length;
    
    const maxAulasPorDia = disciplina.permiteAulasGeminadas ? 2 : 1;
    if (aulasNoDia >= maxAulasPorDia) continue;
    
    for (const horario of horarios) {
      const chave = `${dia}-${horario}`;
      
      if (grade[dia][horario] === null && !ocupacao.has(chave)) {
        const aulaInfo = {
          disciplinaId: disciplina.id,
          professorId: professor.id,
          disciplinaNome: disciplina.nome,
          professorNome: professor.nome
        };
        
        grade[dia][horario] = aulaInfo;
        ocupacao.add(chave);
        
        return true;
      }
    }
  }
  
  return false;
}

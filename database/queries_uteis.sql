
-- ===================================================================
-- CONSULTAS ÚTEIS PARA O SISTEMA DE HORÁRIOS
-- ===================================================================

-- 1. Listar professores e suas disciplinas disponíveis
SELECT 
    p.nome as professor,
    string_agg(d.nome, ', ') as disciplinas,
    p.horas_matutino,
    p.horas_vespertino,
    p.horas_noturno
FROM professores p
JOIN professor_disciplinas pd ON p.id = pd.professor_id
JOIN disciplinas d ON pd.disciplina_id = d.id
WHERE p.ativo = true AND d.ativa = true
GROUP BY p.id, p.nome, p.horas_matutino, p.horas_vespertino, p.horas_noturno
ORDER BY p.nome;

-- 2. Verificar carga horária total necessária por turno
SELECT 
    t.turno,
    COUNT(*) as total_turmas,
    SUM(d.carga_horaria_semanal) as carga_horaria_total
FROM turmas t
JOIN turma_disciplinas td ON t.id = td.turma_id
JOIN disciplinas d ON td.disciplina_id = d.id
WHERE t.ativa = true AND d.ativa = true
GROUP BY t.turno
ORDER BY t.turno;

-- 3. Listar conflitos não resolvidos
SELECT 
    cg.tipo_conflito,
    cg.descricao,
    t.nome as turma,
    cg.created_at
FROM conflitos_geracao cg
LEFT JOIN horarios_gerados hg ON cg.horario_gerado_id = hg.id
LEFT JOIN turmas t ON hg.turma_id = t.id
WHERE cg.resolvido = false
ORDER BY cg.created_at DESC;

-- 4. Verificar disponibilidade de professores por disciplina e turno
SELECT 
    d.nome as disciplina,
    t.turno,
    COUNT(DISTINCT p.id) as professores_disponiveis,
    string_agg(DISTINCT p.nome, ', ') as nomes_professores
FROM disciplinas d
CROSS JOIN (SELECT DISTINCT turno FROM turmas WHERE ativa = true) t
LEFT JOIN professor_disciplinas pd ON d.id = pd.disciplina_id
LEFT JOIN professores p ON pd.professor_id = p.id
    AND ((t.turno = 'matutino' AND p.horas_matutino > 0)
      OR (t.turno = 'vespertino' AND p.horas_vespertino > 0)
      OR (t.turno = 'noturno' AND p.horas_noturno > 0))
    AND p.ativo = true
WHERE d.ativa = true
GROUP BY d.nome, t.turno
ORDER BY d.nome, t.turno;

-- 5. Relatório de ocupação de professores
SELECT 
    p.nome as professor,
    COUNT(ap.id) as total_aulas_semana,
    COUNT(CASE WHEN ap.dia_semana = 'Segunda-feira' THEN 1 END) as seg,
    COUNT(CASE WHEN ap.dia_semana = 'Terça-feira' THEN 1 END) as ter,
    COUNT(CASE WHEN ap.dia_semana = 'Quarta-feira' THEN 1 END) as qua,
    COUNT(CASE WHEN ap.dia_semana = 'Quinta-feira' THEN 1 END) as qui,
    COUNT(CASE WHEN ap.dia_semana = 'Sexta-feira' THEN 1 END) as sex
FROM professores p
LEFT JOIN aulas_programadas ap ON p.id = ap.professor_id
LEFT JOIN horarios_gerados hg ON ap.horario_gerado_id = hg.id
WHERE p.ativo = true AND (hg.ativo = true OR hg.id IS NULL)
GROUP BY p.id, p.nome
ORDER BY p.nome;

-- 6. Verificar turmas sem horário gerado
SELECT 
    t.nome as turma,
    t.serie,
    t.turno
FROM turmas t
LEFT JOIN horarios_gerados hg ON t.id = hg.turma_id AND hg.ativo = true
WHERE t.ativa = true AND hg.id IS NULL
ORDER BY t.turno, t.nome;

-- 7. Estatísticas gerais do sistema
SELECT 
    'Disciplinas Ativas' as item,
    COUNT(*)::text as quantidade
FROM disciplinas WHERE ativa = true
UNION ALL
SELECT 
    'Professores Ativos',
    COUNT(*)::text
FROM professores WHERE ativo = true
UNION ALL
SELECT 
    'Turmas Ativas',
    COUNT(*)::text
FROM turmas WHERE ativa = true
UNION ALL
SELECT 
    'Horários Gerados',
    COUNT(*)::text
FROM horarios_gerados WHERE ativo = true;


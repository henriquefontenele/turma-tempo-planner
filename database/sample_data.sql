
-- ===================================================================
-- DADOS DE EXEMPLO PARA TESTE DO SISTEMA
-- ===================================================================

-- Inserir disciplinas de exemplo
INSERT INTO disciplinas (nome, carga_horaria_semanal, permite_aulas_geminadas) VALUES
('Matemática', 6, true),
('Português', 5, true),
('História', 3, false),
('Geografia', 3, false),
('Ciências', 4, true),
('Educação Física', 2, true),
('Arte', 2, false),
('Inglês', 3, false),
('Filosofia', 2, false),
('Sociologia', 2, false);

-- Inserir professores de exemplo
INSERT INTO professores (nome, email, horas_matutino, horas_vespertino, horas_noturno) VALUES
('Maria Silva', 'maria.silva@escola.com', 25, 0, 0),
('João Santos', 'joao.santos@escola.com', 0, 25, 0),
('Ana Costa', 'ana.costa@escola.com', 20, 20, 0),
('Pedro Oliveira', 'pedro.oliveira@escola.com', 0, 0, 20),
('Carla Mendes', 'carla.mendes@escola.com', 15, 15, 0),
('Roberto Lima', 'roberto.lima@escola.com', 0, 20, 15);

-- Relacionar professores com disciplinas
INSERT INTO professor_disciplinas (professor_id, disciplina_id)
SELECT p.id, d.id FROM professores p, disciplinas d 
WHERE (p.nome = 'Maria Silva' AND d.nome IN ('Matemática', 'Ciências'))
   OR (p.nome = 'João Santos' AND d.nome IN ('Português', 'Arte'))
   OR (p.nome = 'Ana Costa' AND d.nome IN ('História', 'Geografia'))
   OR (p.nome = 'Pedro Oliveira' AND d.nome IN ('Inglês', 'Filosofia'))
   OR (p.nome = 'Carla Mendes' AND d.nome IN ('Educação Física', 'Arte'))
   OR (p.nome = 'Roberto Lima' AND d.nome IN ('Sociologia', 'História'));

-- Inserir algumas restrições de professores
INSERT INTO professor_restricoes (professor_id, dia_semana)
SELECT p.id, 'Sexta-feira' FROM professores p WHERE p.nome = 'Maria Silva';

INSERT INTO professor_restricoes (professor_id, dia_semana, turno)
SELECT p.id, 'Segunda-feira', 'matutino' FROM professores p WHERE p.nome = 'Ana Costa';

-- Inserir turmas de exemplo
INSERT INTO turmas (nome, serie, turno) VALUES
('1º Ano A', '1ano', 'matutino'),
('1º Ano B', '1ano', 'vespertino'),
('2º Ano A', '2ano', 'matutino'),
('3º Ano A', '3ano', 'noturno');

-- Relacionar turmas com disciplinas
INSERT INTO turma_disciplinas (turma_id, disciplina_id)
SELECT t.id, d.id FROM turmas t, disciplinas d 
WHERE t.serie IN ('1ano', '2ano') AND d.nome IN ('Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Educação Física', 'Arte', 'Inglês');

INSERT INTO turma_disciplinas (turma_id, disciplina_id)
SELECT t.id, d.id FROM turmas t, disciplinas d 
WHERE t.serie = '3ano' AND d.nome IN ('Matemática', 'Português', 'História', 'Geografia', 'Filosofia', 'Sociologia', 'Arte', 'Inglês');


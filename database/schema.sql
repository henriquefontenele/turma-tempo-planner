
-- ===================================================================
-- SISTEMA DE GERAÇÃO AUTOMÁTICA DE HORÁRIOS ESCOLARES
-- Estrutura do Banco de Dados
-- ===================================================================

-- Extensões necessárias (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- TABELA: disciplinas
-- Armazena informações sobre as disciplinas/matérias
-- ===================================================================
CREATE TABLE disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    carga_horaria_semanal INTEGER NOT NULL CHECK (carga_horaria_semanal > 0 AND carga_horaria_semanal <= 20),
    permite_aulas_geminadas BOOLEAN NOT NULL DEFAULT false,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- TABELA: professores
-- Armazena informações sobre os professores
-- ===================================================================
CREATE TABLE professores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefone VARCHAR(20),
    horas_matutino INTEGER NOT NULL DEFAULT 0 CHECK (horas_matutino >= 0),
    horas_vespertino INTEGER NOT NULL DEFAULT 0 CHECK (horas_vespertino >= 0),
    horas_noturno INTEGER NOT NULL DEFAULT 0 CHECK (horas_noturno >= 0),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- TABELA: professor_disciplinas
-- Relacionamento N:N entre professores e disciplinas
-- ===================================================================
CREATE TABLE professor_disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professor_id, disciplina_id)
);

-- ===================================================================
-- TABELA: professor_restricoes
-- Dias indisponíveis para cada professor
-- ===================================================================
CREATE TABLE professor_restricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira')),
    turno VARCHAR(20) CHECK (turno IN ('matutino', 'vespertino', 'noturno')), -- NULL = todos os turnos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professor_id, dia_semana, turno)
);

-- ===================================================================
-- TABELA: turmas
-- Armazena informações sobre as turmas
-- ===================================================================
CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL,
    serie VARCHAR(20) NOT NULL,
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('matutino', 'vespertino', 'noturno')),
    ano_letivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nome, ano_letivo)
);

-- ===================================================================
-- TABELA: turma_disciplinas
-- Relacionamento N:N entre turmas e disciplinas
-- ===================================================================
CREATE TABLE turma_disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(turma_id, disciplina_id)
);

-- ===================================================================
-- TABELA: configuracoes_turno
-- Configurações de horário para cada turno
-- ===================================================================
CREATE TABLE configuracoes_turno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turno VARCHAR(20) NOT NULL UNIQUE CHECK (turno IN ('matutino', 'vespertino', 'noturno')),
    inicio_aulas TIME NOT NULL,
    fim_aulas TIME NOT NULL,
    inicio_intervalo TIME,
    fim_intervalo TIME,
    aulas_por_dia INTEGER NOT NULL CHECK (aulas_por_dia > 0 AND aulas_por_dia <= 12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (fim_aulas > inicio_aulas),
    CHECK (inicio_intervalo IS NULL OR fim_intervalo IS NULL OR fim_intervalo > inicio_intervalo)
);

-- ===================================================================
-- TABELA: horarios_gerados
-- Armazena os horários gerados para cada turma
-- ===================================================================
CREATE TABLE horarios_gerados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    data_geracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- TABELA: aulas_programadas
-- Detalhes de cada aula no horário gerado
-- ===================================================================
CREATE TABLE aulas_programadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horario_gerado_id UUID NOT NULL REFERENCES horarios_gerados(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id),
    professor_id UUID NOT NULL REFERENCES professores(id),
    dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira')),
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    eh_aula_geminada BOOLEAN NOT NULL DEFAULT false,
    sequencia_geminada INTEGER, -- 1 ou 2 para identificar primeira/segunda aula geminada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (horario_fim > horario_inicio)
);

-- ===================================================================
-- TABELA: conflitos_geracao
-- Log de conflitos/erros durante a geração de horários
-- ===================================================================
CREATE TABLE conflitos_geracao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horario_gerado_id UUID REFERENCES horarios_gerados(id) ON DELETE CASCADE,
    tipo_conflito VARCHAR(50) NOT NULL CHECK (tipo_conflito IN ('conflito_professor', 'carga_horaria_insuficiente', 'sem_professor_disponivel', 'configuracao_invalida')),
    descricao TEXT NOT NULL,
    detalhes JSONB,
    resolvido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- ÍNDICES PARA PERFORMANCE
-- ===================================================================

-- Índices para buscas frequentes
CREATE INDEX idx_professores_ativo ON professores(ativo);
CREATE INDEX idx_disciplinas_ativa ON disciplinas(ativa);
CREATE INDEX idx_turmas_ativa ON turmas(ativa);
CREATE INDEX idx_turmas_turno ON turmas(turno);
CREATE INDEX idx_turmas_ano_letivo ON turmas(ano_letivo);

-- Índices para relacionamentos
CREATE INDEX idx_professor_disciplinas_professor ON professor_disciplinas(professor_id);
CREATE INDEX idx_professor_disciplinas_disciplina ON professor_disciplinas(disciplina_id);
CREATE INDEX idx_professor_restricoes_professor ON professor_restricoes(professor_id);
CREATE INDEX idx_turma_disciplinas_turma ON turma_disciplinas(turma_id);
CREATE INDEX idx_turma_disciplinas_disciplina ON turma_disciplinas(disciplina_id);

-- Índices para horários
CREATE INDEX idx_horarios_gerados_turma ON horarios_gerados(turma_id);
CREATE INDEX idx_horarios_gerados_ativo ON horarios_gerados(ativo);
CREATE INDEX idx_aulas_programadas_horario ON aulas_programadas(horario_gerado_id);
CREATE INDEX idx_aulas_programadas_dia_horario ON aulas_programadas(dia_semana, horario_inicio);
CREATE INDEX idx_conflitos_tipo ON conflitos_geracao(tipo_conflito);
CREATE INDEX idx_conflitos_resolvido ON conflitos_geracao(resolvido);

-- ===================================================================
-- TRIGGERS PARA ATUALIZAR TIMESTAMPS
-- ===================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON professores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_turno_updated_at BEFORE UPDATE ON configuracoes_turno FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- DADOS INICIAIS DE CONFIGURAÇÃO
-- ===================================================================

-- Configurações padrão dos turnos
INSERT INTO configuracoes_turno (turno, inicio_aulas, fim_aulas, inicio_intervalo, fim_intervalo, aulas_por_dia) VALUES
('matutino', '07:00', '12:00', '09:30', '09:50', 5),
('vespertino', '13:00', '18:00', '15:30', '15:50', 5),
('noturno', '19:00', '23:00', '21:00', '21:15', 4);

-- ===================================================================
-- VIEWS ÚTEIS PARA CONSULTAS
-- ===================================================================

-- View com professores e suas disciplinas
CREATE VIEW view_professores_disciplinas AS
SELECT 
    p.id as professor_id,
    p.nome as professor_nome,
    p.email,
    p.horas_matutino,
    p.horas_vespertino,
    p.horas_noturno,
    d.id as disciplina_id,
    d.nome as disciplina_nome,
    d.carga_horaria_semanal
FROM professores p
JOIN professor_disciplinas pd ON p.id = pd.professor_id
JOIN disciplinas d ON pd.disciplina_id = d.id
WHERE p.ativo = true AND d.ativa = true;

-- View com turmas e suas disciplinas
CREATE VIEW view_turmas_disciplinas AS
SELECT 
    t.id as turma_id,
    t.nome as turma_nome,
    t.serie,
    t.turno,
    t.ano_letivo,
    d.id as disciplina_id,
    d.nome as disciplina_nome,
    d.carga_horaria_semanal,
    d.permite_aulas_geminadas
FROM turmas t
JOIN turma_disciplinas td ON t.id = td.turma_id
JOIN disciplinas d ON td.disciplina_id = d.id
WHERE t.ativa = true AND d.ativa = true;

-- View com horários completos
CREATE VIEW view_horarios_completos AS
SELECT 
    hg.id as horario_id,
    t.nome as turma_nome,
    t.turno,
    ap.dia_semana,
    ap.horario_inicio,
    ap.horario_fim,
    d.nome as disciplina_nome,
    p.nome as professor_nome,
    ap.eh_aula_geminada,
    hg.data_geracao
FROM horarios_gerados hg
JOIN turmas t ON hg.turma_id = t.id
JOIN aulas_programadas ap ON hg.id = ap.horario_gerado_id
JOIN disciplinas d ON ap.disciplina_id = d.id
JOIN professores p ON ap.professor_id = p.id
WHERE hg.ativo = true
ORDER BY t.nome, ap.dia_semana, ap.horario_inicio;

-- ===================================================================
-- COMENTÁRIOS SOBRE O SCHEMA
-- ===================================================================

COMMENT ON TABLE disciplinas IS 'Armazena as disciplinas/matérias disponíveis no sistema';
COMMENT ON TABLE professores IS 'Cadastro de professores com disponibilidade por turno';
COMMENT ON TABLE professor_disciplinas IS 'Relacionamento N:N - quais disciplinas cada professor pode lecionar';
COMMENT ON TABLE professor_restricoes IS 'Dias/turnos indisponíveis para cada professor';
COMMENT ON TABLE turmas IS 'Cadastro de turmas por série e turno';
COMMENT ON TABLE turma_disciplinas IS 'Relacionamento N:N - quais disciplinas cada turma deve ter';
COMMENT ON TABLE configuracoes_turno IS 'Configurações de horário para cada turno (matutino, vespertino, noturno)';
COMMENT ON TABLE horarios_gerados IS 'Cabeçalho dos horários gerados para cada turma';
COMMENT ON TABLE aulas_programadas IS 'Detalhes de cada aula no horário (dia, hora, professor, disciplina)';
COMMENT ON TABLE conflitos_geracao IS 'Log de problemas encontrados durante a geração de horários';


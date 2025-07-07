
# Estrutura do Banco de Dados - Sistema de Horários Escolares

## Visão Geral

Este esquema de banco de dados foi projetado para suportar um sistema completo de geração automática de horários escolares, incluindo:

- Cadastro de disciplinas, professores e turmas
- Configuração de turnos e horários
- Geração automática de grades horárias
- Controle de restrições e conflitos
- Histórico e versionamento de horários

## Estrutura das Tabelas

### Tabelas Principais

1. **disciplinas** - Matérias/disciplinas disponíveis
2. **professores** - Cadastro de professores com disponibilidade por turno
3. **turmas** - Turmas organizadas por série e turno
4. **configuracoes_turno** - Configurações de horário para cada turno

### Tabelas de Relacionamento

5. **professor_disciplinas** - Quais disciplinas cada professor pode lecionar
6. **turma_disciplinas** - Quais disciplinas cada turma deve ter
7. **professor_restricoes** - Dias/turnos indisponíveis para professores

### Tabelas de Horários

8. **horarios_gerados** - Cabeçalho dos horários gerados
9. **aulas_programadas** - Detalhes de cada aula (dia, hora, professor, disciplina)
10. **conflitos_geracao** - Log de problemas durante a geração

## Características Técnicas

### Banco de Dados Recomendado
- **PostgreSQL** (preferido) - suporte completo a UUID, JSONB, triggers
- **MySQL 8.0+** - alternativa com adaptações menores
- **SQLite** - para desenvolvimento/teste local

### Recursos Utilizados
- **UUIDs** como chaves primárias para melhor escalabilidade
- **Triggers** para atualização automática de timestamps
- **Constraints** para validação de dados
- **Índices** otimizados para consultas frequentes
- **Views** para consultas complexas recorrentes

## Plataformas de Hospedagem Gratuitas

### Recomendadas:

1. **Supabase** (PostgreSQL)
   - 500MB gratuito
   - Interface web completa
   - APIs automáticas
   - Integração direta com o frontend

2. **Firebase Firestore** (NoSQL)
   - Requer adaptação do esquema
   - Escalabilidade automática
   - Integração com autenticação

3. **PlanetScale** (MySQL)
   - Branch-based development
   - 10GB gratuito
   - Escalabilidade automática

4. **Railway** (PostgreSQL/MySQL)
   - $5 de crédito mensal gratuito
   - Deploy automático

## Como Usar

### 1. Configuração Inicial
```sql
-- Execute primeiro o schema.sql
psql -d sua_database -f schema.sql

-- Depois os dados de exemplo (opcional)
psql -d sua_database -f sample_data.sql
```

### 2. Configuração dos Turnos
As configurações padrão já estão incluídas, mas podem ser ajustadas:
- Matutino: 07:00-12:00 (5 aulas)
- Vespertino: 13:00-18:00 (5 aulas)  
- Noturno: 19:00-23:00 (4 aulas)

### 3. Fluxo de Uso
1. Cadastrar disciplinas com carga horária
2. Cadastrar professores com disponibilidade
3. Relacionar professores às disciplinas que podem lecionar
4. Cadastrar turmas e suas disciplinas
5. Configurar restrições de professores
6. Gerar horários automaticamente

## Consultas Úteis

O arquivo `queries_uteis.sql` contém consultas pré-definidas para:
- Verificar disponibilidade de professores
- Calcular carga horária por turno
- Identificar conflitos
- Gerar relatórios de ocupação

## Integração com o Frontend

O esquema está alinhado com os tipos TypeScript definidos no frontend:
- `Disciplina` → tabela `disciplinas`
- `Professor` → tabela `professores` 
- `Turma` → tabela `turmas`
- `HorarioGerado` → tabelas `horarios_gerados` + `aulas_programadas`
- `ErroGeracao` → tabela `conflitos_geracao`

## Próximos Passos

1. **Escolher plataforma**: Recomendo Supabase para integração mais fácil
2. **Criar database**: Executar os scripts SQL
3. **Configurar API**: Conectar o frontend ao banco
4. **Testar fluxo**: Usar dados de exemplo para validar
5. **Implementar backup**: Configurar backup automático dos dados

## Escalabilidade

O esquema suporta:
- Múltiplas escolas (adicionando campo `escola_id`)
- Semestres/períodos (campo `periodo` nas tabelas)
- Salas/recursos (nova tabela `salas`)
- Feriados/eventos (nova tabela `calendario`)


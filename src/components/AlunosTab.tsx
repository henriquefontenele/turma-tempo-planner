
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Escola, Turma, Estudante, Matricula } from '@/types';
import { Users, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';

interface AlunosTabProps {
  escolas: Escola[];
  turmas: Turma[];
  estudantes: Estudante[];
  matriculas: Matricula[];
}

export function AlunosTab({ escolas, turmas, estudantes, matriculas }: AlunosTabProps) {
  const [filtros, setFiltros] = useState({
    escola: '',
    turma: '',
    turno: '',
    busca: '',
  });

  const gerarComprovantePDF = (matricula: Matricula, estudante: Estudante) => {
    const doc = new jsPDF();
    const escola = escolas.find(e => e.id === matricula.escolaId);
    const turma = turmas.find(t => t.id === matricula.turmaId);

    doc.setFontSize(20);
    doc.text('COMPROVANTE DE MATRÍCULA', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Escola: ${escola?.nome || 'N/A'}`, 20, 50);
    doc.text(`Número da Matrícula: ${matricula.numeroMatricula}`, 20, 60);
    doc.text(`Data da Matrícula: ${new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}`, 20, 70);
    
    doc.setFontSize(14);
    doc.text('DADOS DO ESTUDANTE', 20, 90);
    doc.setFontSize(12);
    doc.text(`Nome: ${estudante.nome}`, 20, 105);
    doc.text(`CPF: ${estudante.cpf}`, 20, 115);
    doc.text(`Data de Nascimento: ${new Date(estudante.dataNascimento).toLocaleDateString('pt-BR')}`, 20, 125);
    doc.text(`E-mail: ${estudante.email}`, 20, 135);
    doc.text(`Telefone: ${estudante.telefone}`, 20, 145);
    
    doc.setFontSize(14);
    doc.text('DADOS DA TURMA', 20, 165);
    doc.setFontSize(12);
    doc.text(`Turma: ${turma?.nome || 'N/A'}`, 20, 180);
    doc.text(`Série: ${turma?.serie || 'N/A'}`, 20, 190);
    doc.text(`Turno: ${turma?.turno || 'N/A'}`, 20, 200);

    doc.save(`comprovante-${matricula.numeroMatricula}.pdf`);
  };

  const turmasFiltradas = turmas.filter(t => 
    (!filtros.escola || t.escolaId === filtros.escola) &&
    (!filtros.turno || t.turno === filtros.turno)
  );

  const matriculasFiltradas = matriculas.filter(matricula => {
    const estudante = estudantes.find(e => e.id === matricula.estudanteId);
    const turma = turmas.find(t => t.id === matricula.turmaId);
    
    return (!filtros.escola || matricula.escolaId === filtros.escola) &&
           (!filtros.turma || matricula.turmaId === filtros.turma) &&
           (!filtros.turno || turma?.turno === filtros.turno) &&
           (!filtros.busca || 
            estudante?.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
            matricula.numeroMatricula.includes(filtros.busca)
           );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alunos Matriculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Escola</Label>
              <Select value={filtros.escola} onValueChange={(value) => setFiltros({ ...filtros, escola: value, turma: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as escolas</SelectItem>
                  {escolas.filter(e => e.ativa).map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Turma</Label>
              <Select value={filtros.turma} onValueChange={(value) => setFiltros({ ...filtros, turma: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as turmas</SelectItem>
                  {turmasFiltradas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Turno</Label>
              <Select value={filtros.turno} onValueChange={(value) => setFiltros({ ...filtros, turno: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os turnos</SelectItem>
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou matrícula..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Tabela de Resultados */}
          {matriculasFiltradas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum aluno encontrado com os filtros aplicados.</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Matrícula</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matriculasFiltradas.map((matricula) => {
                    const estudante = estudantes.find(e => e.id === matricula.estudanteId);
                    const escola = escolas.find(e => e.id === matricula.escolaId);
                    const turma = turmas.find(t => t.id === matricula.turmaId);
                    
                    return (
                      <TableRow key={matricula.id}>
                        <TableCell className="font-medium">{matricula.numeroMatricula}</TableCell>
                        <TableCell>{estudante?.nome}</TableCell>
                        <TableCell>{escola?.nome}</TableCell>
                        <TableCell>{turma?.nome}</TableCell>
                        <TableCell className="capitalize">{turma?.turno}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            matricula.status === 'ativa' ? 'bg-green-100 text-green-800' :
                            matricula.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {matricula.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => estudante && gerarComprovantePDF(matricula, estudante)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Total de alunos: {matriculasFiltradas.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

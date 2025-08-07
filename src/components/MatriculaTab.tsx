
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Escola, Turma, Estudante, Matricula } from '@/types';
import { UserPlus, FileText, Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';

export function MatriculaTab() {
  const { data: escolas } = useFirestoreCollection<Escola>('escolas');
  const { data: turmas, updateItem: updateTurma } = useFirestoreCollection<Turma>('turmas');
  const { data: estudantes, addItem: addEstudante } = useFirestoreCollection<Estudante>('estudantes');
  const { data: matriculas, addItem: addMatricula } = useFirestoreCollection<Matricula>('matriculas');
  const [escolaSelecionada, setEscolaSelecionada] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    endereco: '',
    nomeResponsavel: '',
    telefoneResponsavel: '',
    turmaId: '',
    observacoes: '',
  });
  const { toast } = useToast();

  const turmasDisponiveis = turmas.filter(t => 
    t.escolaId === escolaSelecionada && 
    t.vagas && 
    (t.vagasOcupadas || 0) < t.vagas
  );

  const gerarNumeroMatricula = () => {
    const ano = new Date().getFullYear();
    const proximoNumero = matriculas.length + 1;
    return `${ano}${proximoNumero.toString().padStart(6, '0')}`;
  };

  const gerarComprovantePDF = (matricula: Matricula, estudante: Estudante) => {
    const doc = new jsPDF();
    const escola = escolas.find(e => e.id === matricula.escolaId);
    const turma = turmas.find(t => t.id === matricula.turmaId);

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('COMPROVANTE DE MATRÍCULA', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Escola: ${escola?.nome || 'N/A'}`, 20, 50);
    doc.text(`Número da Matrícula: ${matricula.numeroMatricula}`, 20, 60);
    doc.text(`Data da Matrícula: ${new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}`, 20, 70);
    
    // Dados do Estudante
    doc.setFontSize(14);
    doc.text('DADOS DO ESTUDANTE', 20, 90);
    doc.setFontSize(12);
    doc.text(`Nome: ${estudante.nome}`, 20, 105);
    doc.text(`CPF: ${estudante.cpf}`, 20, 115);
    doc.text(`Data de Nascimento: ${new Date(estudante.dataNascimento).toLocaleDateString('pt-BR')}`, 20, 125);
    doc.text(`E-mail: ${estudante.email}`, 20, 135);
    doc.text(`Telefone: ${estudante.telefone}`, 20, 145);
    doc.text(`Endereço: ${estudante.endereco}`, 20, 155);
    
    if (estudante.nomeResponsavel) {
      doc.text(`Responsável: ${estudante.nomeResponsavel}`, 20, 165);
      doc.text(`Telefone do Responsável: ${estudante.telefoneResponsavel}`, 20, 175);
    }

    // Dados da Turma
    doc.setFontSize(14);
    doc.text('DADOS DA TURMA', 20, 195);
    doc.setFontSize(12);
    doc.text(`Turma: ${turma?.nome || 'N/A'}`, 20, 210);
    doc.text(`Série: ${turma?.serie || 'N/A'}`, 20, 220);
    doc.text(`Turno: ${turma?.turno || 'N/A'}`, 20, 230);

    if (matricula.observacoes) {
      doc.setFontSize(14);
      doc.text('OBSERVAÇÕES', 20, 250);
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(matricula.observacoes, 170);
      doc.text(splitText, 20, 265);
    }

    // Rodapé
    doc.setFontSize(10);
    doc.text('Este documento comprova a matrícula do estudante na instituição.', 20, 280);
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 290);

    doc.save(`comprovante-matricula-${matricula.numeroMatricula}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!escolaSelecionada || !formData.turmaId || !formData.nome.trim() || !formData.cpf.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const numeroMatricula = gerarNumeroMatricula();

    // Criar estudante
    const novoEstudante: Omit<Estudante, 'id'> = {
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim(),
      dataNascimento: formData.dataNascimento,
      email: formData.email.trim(),
      telefone: formData.telefone.trim(),
      endereco: formData.endereco.trim(),
      nomeResponsavel: formData.nomeResponsavel.trim() || undefined,
      telefoneResponsavel: formData.telefoneResponsavel.trim() || undefined,
    };

    // Criar matrícula
    const novaMatricula: Omit<Matricula, 'id'> = {
      numeroMatricula,
      estudanteId: '', // Will be set after adding student
      escolaId: escolaSelecionada,
      turmaId: formData.turmaId,
      dataMatricula: new Date().toISOString(),
      status: 'ativa',
      observacoes: formData.observacoes.trim() || undefined,
    };

    try {
      // Add student first and get the ID
      await addEstudante(novoEstudante);
      
      // Add matricula with the student ID - use a generated ID since Firestore handles ID creation
      novaMatricula.estudanteId = Date.now().toString();
      await addMatricula(novaMatricula);

      // Update class vacancies
      const turma = turmas.find(t => t.id === formData.turmaId);
      if (turma) {
        await updateTurma(formData.turmaId, { 
          ...turma, 
          vagasOcupadas: (turma.vagasOcupadas || 0) + 1 
        });
      }

      // Generate PDF
      setTimeout(() => {
        const estudanteCompleto = { 
          id: novaMatricula.estudanteId, 
          ...novoEstudante 
        };
        const matriculaCompleta = { 
          id: Date.now().toString(), 
          ...novaMatricula 
        };
        gerarComprovantePDF(matriculaCompleta, estudanteCompleto);
      }, 100);

      // Reset form
      setFormData({
        nome: '', cpf: '', dataNascimento: '', email: '', telefone: '', 
        endereco: '', nomeResponsavel: '', telefoneResponsavel: '', 
        turmaId: '', observacoes: ''
      });
      setEscolaSelecionada('');
      
      toast({
        title: "Sucesso",
        description: `Matrícula realizada com sucesso! Número: ${numeroMatricula}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao realizar matrícula. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const abrirMatriculaPublica = () => {
    window.open('/matricula', '_blank');
  };

  const escolasAtivas = escolas.filter(e => e.ativa);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Matrícula de Estudante
            </div>
            <Button 
              variant="outline" 
              onClick={abrirMatriculaPublica}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Matrícula Pública
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção de Escola */}
            <div>
              <Label>Escola *</Label>
              <Select value={escolaSelecionada} onValueChange={setEscolaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
                </SelectTrigger>
                <SelectContent>
                  {escolasAtivas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {escolaSelecionada && (
              <div>
                <Label>Turma Disponível *</Label>
                <Select value={formData.turmaId} onValueChange={(value) => setFormData({ ...formData, turmaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmasDisponiveis.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.serie} ({turma.turno}) - 
                        Vagas: {(turma.vagas || 0) - (turma.vagasOcupadas || 0)}/{turma.vagas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {turmasDisponiveis.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Nenhuma turma com vagas disponíveis</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                <Input
                  id="nomeResponsavel"
                  placeholder="Para menores de idade"
                  value={formData.nomeResponsavel}
                  onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefoneResponsavel">Telefone do Responsável</Label>
                <Input
                  id="telefoneResponsavel"
                  value={formData.telefoneResponsavel}
                  onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais (opcional)"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>

            <Button 
              type="submit" 
              className="bg-green-500 hover:bg-green-600"
              disabled={!escolaSelecionada || turmasDisponiveis.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Realizar Matrícula e Gerar Comprovante
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Matrículas */}
      <Card>
        <CardHeader>
          <CardTitle>Matrículas Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          {matriculas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma matrícula realizada.</p>
          ) : (
            <div className="space-y-4">
              {matriculas.map((matricula) => {
                const estudante = estudantes.find(e => e.id === matricula.estudanteId);
                const escola = escolas.find(e => e.id === matricula.escolaId);
                const turma = turmas.find(t => t.id === matricula.turmaId);
                
                return (
                  <div key={matricula.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-lg">{estudante?.nome}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => estudante && gerarComprovantePDF(matricula, estudante)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Comprovante
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div><strong>Matrícula:</strong> {matricula.numeroMatricula}</div>
                      <div><strong>Escola:</strong> {escola?.nome}</div>
                      <div><strong>Turma:</strong> {turma?.nome}</div>
                      <div><strong>CPF:</strong> {estudante?.cpf}</div>
                      <div><strong>Data Matrícula:</strong> {new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}</div>
                      <div><strong>Status:</strong> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          matricula.status === 'ativa' ? 'bg-green-100 text-green-800' :
                          matricula.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {matricula.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

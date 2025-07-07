
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Escola, Turma, Estudante, Matricula } from '@/types';
import { UserPlus, FileText, GraduationCap } from 'lucide-react';
import jsPDF from 'jspdf';

const MatriculaPublica = () => {
  const [escolas] = useLocalStorage<Escola[]>('escolas', []);
  const [turmas, setTurmas] = useLocalStorage<Turma[]>('turmas', []);
  const [estudantes, setEstudantes] = useLocalStorage<Estudante[]>('estudantes', []);
  const [matriculas, setMatriculas] = useLocalStorage<Matricula[]>('matriculas', []);
  
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
    doc.text(`Endereço: ${estudante.endereco}`, 20, 155);
    
    if (estudante.nomeResponsavel) {
      doc.text(`Responsável: ${estudante.nomeResponsavel}`, 20, 165);
      doc.text(`Telefone do Responsável: ${estudante.telefoneResponsavel}`, 20, 175);
    }

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

    doc.setFontSize(10);
    doc.text('Este documento comprova a matrícula do estudante na instituição.', 20, 280);
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 290);

    doc.save(`comprovante-matricula-${matricula.numeroMatricula}.pdf`);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const novoEstudante: Estudante = {
      id: Date.now().toString(),
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim(),
      dataNascimento: formData.dataNascimento,
      email: formData.email.trim(),
      telefone: formData.telefone.trim(),
      endereco: formData.endereco.trim(),
      nomeResponsavel: formData.nomeResponsavel.trim() || undefined,
      telefoneResponsavel: formData.telefoneResponsavel.trim() || undefined,
    };

    const novaMatricula: Matricula = {
      id: (Date.now() + 1).toString(),
      numeroMatricula,
      estudanteId: novoEstudante.id,
      escolaId: escolaSelecionada,
      turmaId: formData.turmaId,
      dataMatricula: new Date().toISOString(),
      status: 'ativa',
      observacoes: formData.observacoes.trim() || undefined,
    };

    const turmasAtualizadas = turmas.map(t => 
      t.id === formData.turmaId 
        ? { ...t, vagasOcupadas: (t.vagasOcupadas || 0) + 1 }
        : t
    );

    setEstudantes([...estudantes, novoEstudante]);
    setMatriculas([...matriculas, novaMatricula]);
    setTurmas(turmasAtualizadas);

    setTimeout(() => {
      gerarComprovantePDF(novaMatricula, novoEstudante);
    }, 100);

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
  };

  const escolasAtivas = escolas.filter(e => e.ativa);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <GraduationCap className="w-8 h-8" />
              Sistema de Matrícula Escolar
            </h1>
            <p className="text-gray-600 mt-2">Realize sua matrícula online de forma rápida e segura</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Formulário de Matrícula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Seleção de Turma */}
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

              {/* Dados do Estudante */}
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
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={!escolaSelecionada || turmasDisponiveis.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Realizar Matrícula e Gerar Comprovante
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MatriculaPublica;

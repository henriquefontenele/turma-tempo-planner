import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePublicFirestoreCollection } from '@/hooks/useFirestore';
import { Escola, Turma, Estudante, Matricula } from '@/types';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserPlus, FileText, GraduationCap } from 'lucide-react';
import jsPDF from 'jspdf';

const MatriculaPublica = () => {
  const { data: escolas } = usePublicFirestoreCollection<Escola>('escolas');
  const { data: turmas } = usePublicFirestoreCollection<Turma>('turmas');
  const { data: matriculas } = usePublicFirestoreCollection<Matricula>('matriculas');
  
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
    
    // Configurações de página
    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;
    
    // Data no topo direito
    doc.setFontSize(12);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.text(dataAtual, pageWidth - 20, 20, { align: 'right' });
    
    // Nome da escola centralizado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text((escola?.nome || 'ESCOLA').toUpperCase(), centerX, 40, { align: 'center' });
    
    // Título do documento
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`COMPROVANTE DE MATRÍCULA - Nº ${matricula.numeroMatricula}`, centerX, 55, { align: 'center' });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 60, pageWidth - 20, 60);
    
    // Mensagem de parabéns
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Parabéns!', centerX, 75, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sua matrícula foi processada com sucesso.', centerX, 85, { align: 'center' });
    
    // Linha separadora
    doc.line(20, 95, pageWidth - 20, 95);
    
    // Seção DADOS DO ALUNO
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO ALUNO', centerX, 110, { align: 'center' });
    
    // Linha separadora pequena
    doc.line(20, 115, pageWidth - 20, 115);
    
    doc.setFont('helvetica', 'normal');
    let yPos = 130;
    doc.text(`Nome do Aluno: ${estudante.nome}`, 30, yPos);
    yPos += 10;
    doc.text(`Data de Nascimento: ${new Date(estudante.dataNascimento).toLocaleDateString('pt-BR')}`, 30, yPos);
    yPos += 10;
    doc.text(`Série/Ano: ${turma?.serie || 'N/A'}`, 30, yPos);
    yPos += 10;
    doc.text(`Turma: ${turma?.nome || 'N/A'} - ${turma?.turno || 'N/A'}`, 30, yPos);
    yPos += 10;
    doc.text(`CPF: ${estudante.cpf}`, 30, yPos);
    yPos += 20;
    
    // Seção RESPONSÁVEL PELA MATRÍCULA (se houver)
    if (estudante.nomeResponsavel) {
      doc.setFont('helvetica', 'bold');
      doc.text('RESPONSÁVEL PELA MATRÍCULA', centerX, yPos, { align: 'center' });
      
      // Linha separadora pequena
      doc.line(20, yPos + 5, pageWidth - 20, yPos + 5);
      
      doc.setFont('helvetica', 'normal');
      yPos += 20;
      doc.text(`Nome Responsável: ${estudante.nomeResponsavel}`, 30, yPos);
      yPos += 10;
      doc.text('Relação com o Aluno: Responsável Legal', 30, yPos);
      yPos += 20;
    }
    
    // Informações de contato/endereço
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.text(`Endereço: ${estudante.endereco}`, 30, yPos);
    yPos += 8;
    doc.text(`Telefone: ${estudante.telefone}`, 30, yPos);
    yPos += 8;
    doc.text(`Email: ${estudante.email}`, 30, yPos);
    yPos += 15;
    
    // Rodapé
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    doc.setFontSize(9);
    doc.text('Este documento comprova a matrícula do estudante na instituição de ensino.', centerX, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Data da Matrícula: ${new Date(matricula.dataMatricula).toLocaleDateString('pt-BR')}`, centerX, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, centerX, yPos, { align: 'center' });

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
      // Add student
      const estudanteRef = await addDoc(collection(db, 'estudantes'), novoEstudante);
      
      // Add matricula with the student ID
      novaMatricula.estudanteId = estudanteRef.id;
      const matriculaRef = await addDoc(collection(db, 'matriculas'), novaMatricula);

      // Update class vacancies
      const turma = turmas.find(t => t.id === formData.turmaId);
      if (turma) {
        await updateDoc(doc(db, 'turmas', formData.turmaId), { 
          vagasOcupadas: (turma.vagasOcupadas || 0) + 1 
        });
      }

      // Generate PDF
      setTimeout(() => {
        const estudanteCompleto = { 
          id: estudanteRef.id, 
          ...novoEstudante 
        };
        const matriculaCompleta = { 
          id: matriculaRef.id, 
          ...novaMatricula,
          estudanteId: estudanteRef.id
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
      console.error('Erro ao realizar matrícula:', error);
      toast({
        title: "Erro",
        description: "Erro ao realizar matrícula. Tente novamente.",
        variant: "destructive",
      });
    }
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

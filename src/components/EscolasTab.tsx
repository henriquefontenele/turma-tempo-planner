
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Escola } from '@/types';
import { Plus, Trash2, Building, Edit } from 'lucide-react';

interface EscolasTabProps {
  escolas: Escola[];
  onEscolasChange: (escolas: Escola[]) => void;
}

export function EscolasTab({ escolas, onEscolasChange }: EscolasTabProps) {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    ativa: true,
  });
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.endereco.trim()) {
      toast({
        title: "Erro",
        description: "Nome e endereço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const novaEscola: Escola = {
      id: Date.now().toString(),
      nome: formData.nome.trim(),
      endereco: formData.endereco.trim(),
      telefone: formData.telefone.trim(),
      email: formData.email.trim(),
      ativa: formData.ativa,
    };

    onEscolasChange([...escolas, novaEscola]);
    setFormData({ nome: '', endereco: '', telefone: '', email: '', ativa: true });
    
    toast({
      title: "Sucesso",
      description: "Escola cadastrada com sucesso!",
    });
  };

  const handleEdit = (escola: Escola) => {
    setEditingEscola(escola);
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEscola || !editingEscola.nome.trim() || !editingEscola.endereco.trim()) {
      toast({
        title: "Erro",
        description: "Nome e endereço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const escolasAtualizadas = escolas.map(e => 
      e.id === editingEscola.id ? editingEscola : e
    );
    
    onEscolasChange(escolasAtualizadas);
    setEditModalOpen(false);
    setEditingEscola(null);
    
    toast({
      title: "Sucesso",
      description: "Escola atualizada com sucesso!",
    });
  };

  const handleDelete = (id: string) => {
    onEscolasChange(escolas.filter(e => e.id !== id));
    toast({
      title: "Sucesso",
      description: "Escola removida com sucesso!",
    });
  };

  const toggleAtiva = (id: string) => {
    onEscolasChange(escolas.map(e => 
      e.id === id ? { ...e, ativa: !e.ativa } : e
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Cadastrar Escola
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Colégio São José"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro, cidade"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 9999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@escola.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked })}
              />
              <Label htmlFor="ativa">Escola ativa</Label>
            </div>

            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Escola
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {escolas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma escola cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {escolas.map((escola) => (
                <div key={escola.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-lg flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {escola.nome}
                      {!escola.ativa && <span className="text-red-500 text-sm">(Inativa)</span>}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={escola.ativa}
                        onCheckedChange={() => toggleAtiva(escola.id)}
                      />
                      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(escola)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Escola</DialogTitle>
                          </DialogHeader>
                          {editingEscola && (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="edit-nome">Nome da Escola</Label>
                                <Input
                                  id="edit-nome"
                                  value={editingEscola.nome}
                                  onChange={(e) => setEditingEscola({ ...editingEscola, nome: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-endereco">Endereço</Label>
                                <Input
                                  id="edit-endereco"
                                  value={editingEscola.endereco}
                                  onChange={(e) => setEditingEscola({ ...editingEscola, endereco: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-telefone">Telefone</Label>
                                <Input
                                  id="edit-telefone"
                                  value={editingEscola.telefone}
                                  onChange={(e) => setEditingEscola({ ...editingEscola, telefone: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-email">E-mail</Label>
                                <Input
                                  id="edit-email"
                                  type="email"
                                  value={editingEscola.email}
                                  onChange={(e) => setEditingEscola({ ...editingEscola, email: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-ativa"
                                  checked={editingEscola.ativa}
                                  onCheckedChange={(checked) => setEditingEscola({ ...editingEscola, ativa: checked })}
                                />
                                <Label htmlFor="edit-ativa">Escola ativa</Label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button type="submit">Salvar</Button>
                              </div>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(escola.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div><strong>Endereço:</strong> {escola.endereco}</div>
                    <div><strong>Telefone:</strong> {escola.telefone || 'Não informado'}</div>
                    <div><strong>E-mail:</strong> {escola.email || 'Não informado'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

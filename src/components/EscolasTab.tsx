
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Escola } from '@/types';
import { Plus, Trash2, Building } from 'lucide-react';

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

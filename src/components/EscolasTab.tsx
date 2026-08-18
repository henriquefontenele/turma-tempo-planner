
import { useState } from 'react';
import { addDoc, arrayRemove, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Escola, Rede } from '@/types';
import { Plus, Trash2, Building, Edit, Network, RefreshCw } from 'lucide-react';
import { REDE_NOVA_SENTINELA, resolverRedeId, moverEscolaDeRede, migrarEscolasSemRede } from '@/lib/redes';

export function EscolasTab() {
  const { data: escolas, updateItem: updateEscola, deleteItem: deleteEscola } = useFirestoreCollection<Escola>('escolas', true);
  const { data: redes } = useFirestoreCollection<Rede>('redes', false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    ativa: true,
    turnos: [] as ('manhã' | 'tarde' | 'noite')[],
    redeId: REDE_NOVA_SENTINELA,
  });
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [redeOriginalId, setRedeOriginalId] = useState<string | undefined>(undefined);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const { toast } = useToast();

  const nomeDaRede = (redeId?: string) => redes.find((r) => r.id === redeId)?.nome;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.endereco.trim() || formData.turnos.length === 0) {
      toast({
        title: "Erro",
        description: "Nome, endereço e pelo menos um turno são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      // A escola precisa existir antes de saber seu próprio ID (usado quando a
      // rede é nova, ou para entrar na lista de escolas de uma rede existente).
      const escolaRef = await addDoc(collection(db, 'escolas'), {
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        ativa: formData.ativa,
        turnos: formData.turnos,
        redeId: '',
      });

      const redeId = await resolverRedeId(formData.redeId, { id: escolaRef.id, nome: formData.nome.trim() });
      if (formData.redeId && formData.redeId !== REDE_NOVA_SENTINELA) {
        await moverEscolaDeRede(escolaRef.id, undefined, redeId);
      }
      await updateDoc(escolaRef, { redeId });

      setFormData({ nome: '', endereco: '', telefone: '', email: '', ativa: true, turnos: [], redeId: REDE_NOVA_SENTINELA });

      toast({
        title: "Sucesso",
        description: "Escola cadastrada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao cadastrar escola:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar escola.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (escola: Escola) => {
    setEditingEscola({ ...escola, redeId: escola.redeId || REDE_NOVA_SENTINELA });
    setRedeOriginalId(escola.redeId);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEscola || !editingEscola.nome.trim() || !editingEscola.endereco.trim() || editingEscola.turnos.length === 0) {
      toast({
        title: "Erro",
        description: "Nome, endereço e pelo menos um turno são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const redeId = await resolverRedeId(editingEscola.redeId, editingEscola);
      if (redeId !== redeOriginalId) {
        await moverEscolaDeRede(editingEscola.id, redeOriginalId, redeId);
      }
      await updateEscola(editingEscola.id, { ...editingEscola, redeId });
      setEditModalOpen(false);
      setEditingEscola(null);

      toast({
        title: "Sucesso",
        description: "Escola atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar escola:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar escola.",
        variant: "destructive",
      });
    }
  };

  const handleMigrarRedes = async () => {
    setMigrando(true);
    try {
      const migradas = await migrarEscolasSemRede(escolas);
      toast({
        title: migradas > 0 ? 'Migração concluída' : 'Nada a migrar',
        description: migradas > 0
          ? `${migradas} escola(s) receberam uma rede própria.`
          : 'Todas as escolas já pertencem a uma rede.',
      });
    } catch (error) {
      console.error('Erro ao migrar escolas sem rede:', error);
      toast({ title: 'Erro', description: 'Erro ao migrar escolas sem rede.', variant: 'destructive' });
    } finally {
      setMigrando(false);
    }
  };

  const handleDelete = async (id: string) => {
    const escola = escolas.find((e) => e.id === id);
    await deleteEscola(id);
    // Best-effort: tira a escola da lista da rede para não deixar um ID órfão.
    if (escola?.redeId) {
      try {
        await updateDoc(doc(db, 'redes', escola.redeId), { escolaIds: arrayRemove(id) });
      } catch (error) {
        console.warn('Não foi possível atualizar a rede após excluir a escola:', error);
      }
    }
    toast({
      title: "Sucesso",
      description: "Escola removida com sucesso!",
    });
  };

  const toggleAtiva = async (id: string) => {
    const escola = escolas.find(e => e.id === id);
    if (escola) {
      await updateEscola(id, { ...escola, ativa: !escola.ativa });
    }
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

            <div>
              <Label>Turnos de Funcionamento *</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {['manhã', 'tarde', 'noite'].map((turno) => (
                  <div key={turno} className="flex items-center space-x-2">
                    <Checkbox
                      id={turno}
                      checked={formData.turnos.includes(turno as 'manhã' | 'tarde' | 'noite')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, turnos: [...formData.turnos, turno as 'manhã' | 'tarde' | 'noite'] });
                        } else {
                          setFormData({ ...formData, turnos: formData.turnos.filter(t => t !== turno) });
                        }
                      }}
                    />
                    <Label htmlFor={turno} className="capitalize">{turno}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="rede">Rede</Label>
              <Select
                value={formData.redeId}
                onValueChange={(value) => setFormData({ ...formData, redeId: value })}
              >
                <SelectTrigger id="rede">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REDE_NOVA_SENTINELA}>🆕 Rede própria (só esta escola)</SelectItem>
                  {redes.map((rede) => (
                    <SelectItem key={rede.id} value={rede.id}>{rede.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Toda escola pertence a uma rede. Escolha uma rede existente para agrupar com outras escolas, ou deixe como "rede própria" para uma escola avulsa.
              </p>
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
          <div className="flex items-center justify-between">
            <CardTitle>Escolas Cadastradas</CardTitle>
            <Button variant="outline" size="sm" onClick={handleMigrarRedes} disabled={migrando}>
              <RefreshCw className={`w-4 h-4 mr-2 ${migrando ? 'animate-spin' : ''}`} />
              Migrar escolas sem rede
            </Button>
          </div>
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
                      {escola.redeId ? (
                        <Badge variant="outline" className="gap-1 font-normal">
                          <Network className="w-3 h-3" /> {nomeDaRede(escola.redeId) || 'Rede'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-normal">sem rede</Badge>
                      )}
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
                              <div>
                                <Label htmlFor="edit-rede">Rede</Label>
                                <Select
                                  value={editingEscola.redeId || REDE_NOVA_SENTINELA}
                                  onValueChange={(value) => setEditingEscola({ ...editingEscola, redeId: value })}
                                >
                                  <SelectTrigger id="edit-rede">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={REDE_NOVA_SENTINELA}>🆕 Rede própria (só esta escola)</SelectItem>
                                    {redes.map((rede) => (
                                      <SelectItem key={rede.id} value={rede.id}>{rede.nome}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Turnos de Funcionamento *</Label>
                                <div className="flex flex-wrap gap-4 mt-2">
                                  {['manhã', 'tarde', 'noite'].map((turno) => (
                                    <div key={turno} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-${turno}`}
                                        checked={editingEscola.turnos.includes(turno as 'manhã' | 'tarde' | 'noite')}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setEditingEscola({ ...editingEscola, turnos: [...editingEscola.turnos, turno as 'manhã' | 'tarde' | 'noite'] });
                                          } else {
                                            setEditingEscola({ ...editingEscola, turnos: editingEscola.turnos.filter(t => t !== turno) });
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`edit-${turno}`} className="capitalize">{turno}</Label>
                                    </div>
                                  ))}
                                </div>
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
                     <div><strong>Turnos:</strong> {escola.turnos?.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'Não informado'}</div>
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

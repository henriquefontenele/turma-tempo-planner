import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Store, Ticket, Eye, CheckCircle, XCircle, Clock, Copy } from 'lucide-react';
import type { Parceiro, Voucher } from '@/types/parceiros';

export default function ParceirosTab() {
  const { toast } = useToast();
  const { hasPermissao } = useAuth();
  const podeGerenciarParceiros = hasPermissao('fidelidade_gerenciar_parceiros');
  const [activeTab, setActiveTab] = useState('parceiros');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [voucherDetailOpen, setVoucherDetailOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [editingParceiro, setEditingParceiro] = useState<Parceiro | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const { data: parceiros, addItem: addParceiro, updateItem: updateParceiro, deleteItem: deleteParceiro } =
    useFirestoreCollection<Parceiro>('fidelidade_parceiros');
  const { data: vouchers, updateItem: updateVoucher } =
    useFirestoreCollection<Voucher>('fidelidade_vouchers');

  const [novoParceiro, setNovoParceiro] = useState({
    nome: '', contato: '', telefone: '', email: '', endereco: '', descricao: ''
  });

  const resetForm = () => setNovoParceiro({ nome: '', contato: '', telefone: '', email: '', endereco: '', descricao: '' });

  const handleAddParceiro = async () => {
    if (!novoParceiro.nome) {
      toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    await addParceiro({ ...novoParceiro, ativo: true, dataCadastro: new Date().toISOString() });
    resetForm();
    setDialogOpen(false);
    toast({ title: 'Sucesso', description: 'Parceiro cadastrado!' });
  };

  const handleEditParceiro = async () => {
    if (!editingParceiro) return;
    const { id, ...data } = editingParceiro;
    await updateParceiro(id, data);
    setEditDialogOpen(false);
    setEditingParceiro(null);
    toast({ title: 'Sucesso', description: 'Parceiro atualizado!' });
  };

  const handleToggleStatus = async (p: Parceiro) => {
    await updateParceiro(p.id, { ativo: !p.ativo });
    toast({ title: 'Sucesso', description: `Parceiro ${p.ativo ? 'desativado' : 'ativado'}!` });
  };

  const handleMarcarUtilizado = async (v: Voucher) => {
    await updateVoucher(v.id, { status: 'utilizado', dataUtilizacao: new Date().toISOString() });
    toast({ title: 'Sucesso', description: 'Voucher marcado como utilizado!' });
  };

  const handleCancelarVoucher = async (v: Voucher) => {
    await updateVoucher(v.id, { status: 'cancelado' });
    toast({ title: 'Sucesso', description: 'Voucher cancelado!' });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: 'Código copiado para a área de transferência' });
  };

  const getVoucherStatusBadge = (status: Voucher['status']) => {
    const cfg: Record<string, { color: string; icon: typeof Clock }> = {
      ativo: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      utilizado: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      expirado: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      cancelado: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const { color, icon: Icon } = cfg[status];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredVouchers = filterStatus === 'todos' ? vouchers : vouchers.filter(v => v.status === filterStatus);

  const totalParceiros = parceiros.filter(p => p.ativo).length;
  const totalVouchers = vouchers.length;
  const vouchersAtivos = vouchers.filter(v => v.status === 'ativo').length;
  const vouchersUtilizados = vouchers.filter(v => v.status === 'utilizado').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🤝 Parceiros & Vouchers</h2>
        <p className="text-gray-600">Gerencie parceiros comerciais e vouchers de resgate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 rounded-full"><Store className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-600">Parceiros Ativos</p><p className="text-2xl font-bold">{totalParceiros}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-green-100 rounded-full"><Ticket className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-600">Total Vouchers</p><p className="text-2xl font-bold">{totalVouchers}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-yellow-100 rounded-full"><Clock className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-gray-600">Vouchers Ativos</p><p className="text-2xl font-bold">{vouchersAtivos}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 bg-purple-100 rounded-full"><CheckCircle className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-600">Vouchers Utilizados</p><p className="text-2xl font-bold">{vouchersUtilizados}</p></div></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="parceiros" className="flex items-center gap-2"><Store className="w-4 h-4" />Parceiros</TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2"><Ticket className="w-4 h-4" />Vouchers</TabsTrigger>
        </TabsList>

        {/* Tab Parceiros */}
        <TabsContent value="parceiros" className="space-y-4">
          {podeGerenciarParceiros && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Novo Parceiro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Parceiro</DialogTitle>
                <DialogDescription>Adicione um parceiro comercial ao programa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome da Loja *</Label><Input value={novoParceiro.nome} onChange={e => setNovoParceiro({...novoParceiro, nome: e.target.value})} placeholder="Nome do estabelecimento" /></div>
                <div><Label>Pessoa de Contato</Label><Input value={novoParceiro.contato} onChange={e => setNovoParceiro({...novoParceiro, contato: e.target.value})} placeholder="Nome do responsável" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Telefone</Label><Input value={novoParceiro.telefone} onChange={e => setNovoParceiro({...novoParceiro, telefone: e.target.value})} placeholder="(00) 00000-0000" /></div>
                  <div><Label>Email</Label><Input value={novoParceiro.email} onChange={e => setNovoParceiro({...novoParceiro, email: e.target.value})} placeholder="email@loja.com" /></div>
                </div>
                <div><Label>Endereço</Label><Input value={novoParceiro.endereco} onChange={e => setNovoParceiro({...novoParceiro, endereco: e.target.value})} placeholder="Endereço completo" /></div>
                <div><Label>Descrição</Label><Textarea value={novoParceiro.descricao} onChange={e => setNovoParceiro({...novoParceiro, descricao: e.target.value})} placeholder="Sobre o parceiro..." /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddParceiro}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Parceiro</DialogTitle>
              </DialogHeader>
              {editingParceiro && (
                <div className="space-y-4">
                  <div><Label>Nome da Loja *</Label><Input value={editingParceiro.nome} onChange={e => setEditingParceiro({...editingParceiro, nome: e.target.value})} /></div>
                  <div><Label>Pessoa de Contato</Label><Input value={editingParceiro.contato} onChange={e => setEditingParceiro({...editingParceiro, contato: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Telefone</Label><Input value={editingParceiro.telefone} onChange={e => setEditingParceiro({...editingParceiro, telefone: e.target.value})} /></div>
                    <div><Label>Email</Label><Input value={editingParceiro.email} onChange={e => setEditingParceiro({...editingParceiro, email: e.target.value})} /></div>
                  </div>
                  <div><Label>Endereço</Label><Input value={editingParceiro.endereco} onChange={e => setEditingParceiro({...editingParceiro, endereco: e.target.value})} /></div>
                  <div><Label>Descrição</Label><Textarea value={editingParceiro.descricao} onChange={e => setEditingParceiro({...editingParceiro, descricao: e.target.value})} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleEditParceiro}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parceiros.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Nenhum parceiro cadastrado</TableCell></TableRow>
                  ) : (
                    parceiros.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.contato || '-'}</TableCell>
                        <TableCell>{p.telefone || '-'}</TableCell>
                        <TableCell>{p.email || '-'}</TableCell>
                        <TableCell><Badge variant={p.ativo ? 'default' : 'secondary'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                        <TableCell>
                          {podeGerenciarParceiros ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setEditingParceiro(p); setEditDialogOpen(true); }}>Editar</Button>
                              <Button size="sm" variant="outline" onClick={() => handleToggleStatus(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteParceiro(p.id)}>Excluir</Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Somente leitura</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Vouchers */}
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex gap-2 items-center">
            <Label>Filtrar por status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="utilizado">Utilizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voucher detail dialog */}
          <Dialog open={voucherDetailOpen} onOpenChange={setVoucherDetailOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Voucher Digital</DialogTitle>
              </DialogHeader>
              {selectedVoucher && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-dashed border-primary/30">
                    <p className="text-sm text-gray-500 mb-1">Código do Voucher</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-3xl font-mono font-bold tracking-wider text-primary">{selectedVoucher.codigo}</p>
                      <Button size="icon" variant="ghost" onClick={() => copyCode(selectedVoucher.codigo)}><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Recompensa:</span><span className="font-medium">{selectedVoucher.recompensaNome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Parceiro:</span><span className="font-medium">{selectedVoucher.parceiroNome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Usuário:</span><span className="font-medium">{selectedVoucher.usuarioNome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Pontos:</span><span className="font-medium">{selectedVoucher.pontosUtilizados} pts</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status:</span>{getVoucherStatusBadge(selectedVoucher.status)}</div>
                    <div className="flex justify-between"><span className="text-gray-500">Criado em:</span><span>{new Date(selectedVoucher.dataCriacao).toLocaleDateString('pt-BR')}</span></div>
                    {selectedVoucher.dataUtilizacao && <div className="flex justify-between"><span className="text-gray-500">Utilizado em:</span><span>{new Date(selectedVoucher.dataUtilizacao).toLocaleDateString('pt-BR')}</span></div>}
                  </div>
                  {selectedVoucher.recompensaDescricao && (
                    <div className="p-3 bg-gray-50 rounded text-sm"><p className="text-gray-500 mb-1">Descrição da oferta:</p><p>{selectedVoucher.recompensaDescricao}</p></div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Nenhum voucher encontrado</TableCell></TableRow>
                  ) : (
                    filteredVouchers
                      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
                      .map(v => (
                        <TableRow key={v.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="font-mono text-sm font-bold">{v.codigo}</code>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(v.codigo)}><Copy className="w-3 h-3" /></Button>
                            </div>
                          </TableCell>
                          <TableCell>{v.usuarioNome}</TableCell>
                          <TableCell>{v.parceiroNome}</TableCell>
                          <TableCell>{v.recompensaNome}</TableCell>
                          <TableCell>{new Date(v.dataCriacao).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{getVoucherStatusBadge(v.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedVoucher(v); setVoucherDetailOpen(true); }}><Eye className="w-4 h-4" /></Button>
                              {v.status === 'ativo' && podeGerenciarParceiros && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleMarcarUtilizado(v)}>Utilizado</Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelarVoucher(v)}>Cancelar</Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

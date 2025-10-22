import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PerfilAcesso, Permissao, UserProfile } from '@/types';
import { Shield, Edit, Trash2, Users, Check, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PERMISSOES_DISPONIVEIS: { grupo: string; permissoes: { id: Permissao; label: string }[] }[] = [
  {
    grupo: 'Sistema',
    permissoes: [
      { id: 'gerenciar_usuarios', label: 'Gerenciar usuários' },
      { id: 'gerenciar_perfis', label: 'Gerenciar perfis de acesso' },
      { id: 'configuracoes_sistema', label: 'Configurações do sistema' },
    ]
  },
  {
    grupo: 'Cadastros',
    permissoes: [
      { id: 'gerenciar_escolas', label: 'Gerenciar escolas' },
      { id: 'gerenciar_turmas', label: 'Gerenciar turmas' },
      { id: 'gerenciar_disciplinas', label: 'Gerenciar disciplinas' },
      { id: 'gerenciar_professores', label: 'Gerenciar professores' },
      { id: 'gerenciar_alunos', label: 'Gerenciar alunos' },
    ]
  },
  {
    grupo: 'Matrículas e Vagas',
    permissoes: [
      { id: 'gerenciar_matriculas', label: 'Gerenciar matrículas' },
      { id: 'gerenciar_vagas', label: 'Gerenciar vagas' },
    ]
  },
  {
    grupo: 'Horários',
    permissoes: [
      { id: 'gerar_horarios', label: 'Gerar horários' },
      { id: 'visualizar_horarios', label: 'Visualizar horários' },
    ]
  },
  {
    grupo: 'Acadêmico',
    permissoes: [
      { id: 'gerenciar_academico', label: 'Acessar módulo acadêmico' },
      { id: 'registrar_frequencia', label: 'Registrar frequência' },
      { id: 'visualizar_frequencia', label: 'Visualizar frequência' },
      { id: 'registrar_notas', label: 'Registrar notas' },
      { id: 'visualizar_notas', label: 'Visualizar notas' },
    ]
  },
  {
    grupo: 'Relatórios',
    permissoes: [
      { id: 'acessar_relatorios', label: 'Acessar relatórios' },
    ]
  }
];

export function PerfisTab() {
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPerfil, setEditingPerfil] = useState<PerfilAcesso | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEditavel, setSelectedEditavel] = useState<string>('todos');
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const canManageProfiles = userProfile?.role === 'administrador';

  useEffect(() => {
    if (canManageProfiles) {
      loadPerfis();
      loadUsuarios();
    }
  }, [canManageProfiles]);

  const loadPerfis = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'perfis-acesso'));
      const perfisData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PerfilAcesso[];
      setPerfis(perfisData);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis de acesso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usuariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const getUsuariosCount = (roleId: string) => {
    return usuarios.filter(u => u.role === roleId).length;
  };

  const handleCreatePerfil = () => {
    setEditingPerfil({
      id: '',
      nome: '',
      descricao: '',
      permissoes: [],
      editavel: true,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleEditPerfil = (perfil: PerfilAcesso) => {
    if (!perfil.editavel) {
      toast({
        title: "Aviso",
        description: "Este perfil não pode ser editado.",
        variant: "destructive",
      });
      return;
    }
    setEditingPerfil(perfil);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const getPermissoesHerdadas = (perfilId?: string): Permissao[] => {
    if (!perfilId) return [];
    const perfilPai = perfis.find(p => p.id === perfilId);
    if (!perfilPai) return [];
    
    const permissoesPai = [...perfilPai.permissoes];
    if (perfilPai.herdarDe) {
      permissoesPai.push(...getPermissoesHerdadas(perfilPai.herdarDe));
    }
    return [...new Set(permissoesPai)];
  };

  const handleSavePerfil = async () => {
    if (!editingPerfil) return;

    if (!editingPerfil.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do perfil é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const perfilData = {
        nome: editingPerfil.nome,
        descricao: editingPerfil.descricao,
        permissoes: editingPerfil.permissoes,
        herdarDe: editingPerfil.herdarDe || null,
        editavel: editingPerfil.editavel,
      };

      if (isCreating) {
        await addDoc(collection(db, 'perfis-acesso'), perfilData);
        toast({
          title: "Sucesso",
          description: "Perfil criado com sucesso.",
        });
      } else {
        await updateDoc(doc(db, 'perfis-acesso', editingPerfil.id), perfilData);
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingPerfil(null);
      setIsCreating(false);
      loadPerfis();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePerfil = async (perfilId: string) => {
    const perfil = perfis.find(p => p.id === perfilId);
    
    if (!perfil?.editavel) {
      toast({
        title: "Erro",
        description: "Este perfil não pode ser excluído.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;

    try {
      await deleteDoc(doc(db, 'perfis-acesso', perfilId));
      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso.",
      });
      loadPerfis();
    } catch (error) {
      console.error('Erro ao excluir perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir perfil.",
        variant: "destructive",
      });
    }
  };

  const togglePermissao = (permissaoId: Permissao) => {
    if (!editingPerfil) return;

    const permissoes = editingPerfil.permissoes.includes(permissaoId)
      ? editingPerfil.permissoes.filter(p => p !== permissaoId)
      : [...editingPerfil.permissoes, permissaoId];

    setEditingPerfil({
      ...editingPerfil,
      permissoes
    });
  };

  if (!canManageProfiles) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-500">Você não tem permissão para gerenciar perfis de acesso.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando perfis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const permissoesHerdadas = editingPerfil?.herdarDe ? getPermissoesHerdadas(editingPerfil.herdarDe) : [];
  const todasPermissoes = [...new Set([...permissoesHerdadas, ...(editingPerfil?.permissoes || [])])];

  // Filtrar perfis
  const filteredPerfis = perfis.filter(perfil => {
    const matchesSearch = perfil.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perfil.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEditavel = selectedEditavel === 'todos' ||
                           (selectedEditavel === 'editavel' && perfil.editavel) ||
                           (selectedEditavel === 'nao-editavel' && !perfil.editavel);
    
    return matchesSearch && matchesEditavel;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Perfis de Acesso
              </CardTitle>
              <CardDescription>
                Configure perfis de acesso e permissões
              </CardDescription>
            </div>
            <Button onClick={handleCreatePerfil} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Novo Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedEditavel} onValueChange={setSelectedEditavel}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo de perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="editavel">Editáveis</SelectItem>
                <SelectItem value="nao-editavel">Não Editáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerfis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum perfil encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPerfis.map((perfil) => {
                    const usuariosCount = getUsuariosCount(perfil.id);
                    const permissoesHerdadas = perfil.herdarDe ? getPermissoesHerdadas(perfil.herdarDe) : [];
                    const todasPermissoesPerfil = [...new Set([...permissoesHerdadas, ...perfil.permissoes])];
                    
                    return (
                      <TableRow key={perfil.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{perfil.nome}</span>
                            {!perfil.editavel && (
                              <Badge variant="secondary" className="text-xs">Sistema</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{perfil.descricao}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{usuariosCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {todasPermissoesPerfil.slice(0, 3).map(permissaoId => {
                              const permissao = PERMISSOES_DISPONIVEIS
                                .flatMap(g => g.permissoes)
                                .find(p => p.id === permissaoId);
                              return (
                                <Badge key={permissaoId} variant="outline" className="text-xs">
                                  {permissao?.label}
                                </Badge>
                              );
                            })}
                            {todasPermissoesPerfil.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{todasPermissoesPerfil.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {perfil.editavel ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPerfil(perfil)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePerfil(perfil.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Criar Novo Perfil' : 'Editar Perfil'}
            </DialogTitle>
            <DialogDescription>
              Configure um perfil personalizado de acesso
            </DialogDescription>
          </DialogHeader>
          
          {editingPerfil && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Perfil</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Supervisor"
                    value={editingPerfil.nome}
                    onChange={(e) => setEditingPerfil({
                      ...editingPerfil,
                      nome: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="herdarDe">Herdar Permissões De</Label>
                  <Select
                    value={editingPerfil.herdarDe || 'nenhum'}
                    onValueChange={(value) => setEditingPerfil({
                      ...editingPerfil,
                      herdarDe: value === 'nenhum' ? undefined : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {perfis
                        .filter(p => p.id !== editingPerfil.id)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Breve descrição do perfil"
                  value={editingPerfil.descricao}
                  onChange={(e) => setEditingPerfil({
                    ...editingPerfil,
                    descricao: e.target.value
                  })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Permissões Gerais</Label>
                {editingPerfil.herdarDe && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Permissões em cinza são herdadas e não podem ser removidas
                  </p>
                )}
                <div className="space-y-4 mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {PERMISSOES_DISPONIVEIS.map((grupo) => (
                    <div key={grupo.grupo}>
                      <p className="font-medium text-sm mb-2">{grupo.grupo}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {grupo.permissoes.map((permissao) => {
                          const isHerdada = permissoesHerdadas.includes(permissao.id);
                          const isSelected = todasPermissoes.includes(permissao.id);
                          
                          return (
                            <div key={permissao.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`permissao-${permissao.id}`}
                                checked={isSelected}
                                onCheckedChange={() => !isHerdada && togglePermissao(permissao.id)}
                                disabled={isHerdada}
                              />
                              <Label 
                                htmlFor={`permissao-${permissao.id}`}
                                className={`text-sm ${isHerdada ? 'text-muted-foreground' : ''}`}
                              >
                                {permissao.label}
                                {isHerdada && ' (herdada)'}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingPerfil(null);
                setIsCreating(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePerfil}>
              {isCreating ? 'Criar Perfil' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PerfilAcesso, Permissao, UserProfile } from '@/types';
import { Shield, Edit, Trash2, Users, Plus, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildFuncionalidadeParaPermissoes, MODULOS } from '@/config/modulos';
import PermissoesChecklist, { type GrupoPermissoes } from './PermissoesChecklist';

// Cada módulo com tela de CRUD ganha um subgrupo com as 4 permissões
// granulares (visualizar/criar/editar/excluir, + alguma extra sensível). Os
// antigos "gerenciar_X" foram removidos daqui e do tipo Permissao — qualquer
// perfil que ainda os tivesse foi migrado pras granulares equivalentes antes
// da remoção (ver _migrar-permissoes-legado.mjs).
const PERMISSOES_DISPONIVEIS: GrupoPermissoes[] = [
  {
    grupo: 'Sistema',
    subgrupos: [
      { nome: 'Usuários', permissoes: [
        { id: 'visualizar_usuarios', label: 'Visualizar usuários' },
        { id: 'criar_usuarios', label: 'Criar usuários' },
        { id: 'editar_usuarios', label: 'Editar usuários' },
        { id: 'excluir_usuarios', label: 'Excluir usuários' },
        { id: 'alterar_perfil_usuario', label: 'Alterar perfil de outro usuário' },
      ]},
      { nome: 'Perfis de Acesso', permissoes: [
        { id: 'visualizar_perfis', label: 'Visualizar perfis de acesso' },
        { id: 'criar_perfis', label: 'Criar perfis de acesso' },
        { id: 'editar_perfis', label: 'Editar perfis de acesso' },
        { id: 'excluir_perfis', label: 'Excluir perfis de acesso' },
      ]},
      { nome: 'Instalação de Módulos', permissoes: [
        { id: 'visualizar_instalacao_modulos', label: 'Visualizar instalação de módulos' },
        { id: 'ativar_modulos_rede', label: 'Ativar módulo por rede' },
        { id: 'desativar_modulos_rede', label: 'Desativar módulo por rede' },
        { id: 'ativar_modulos_escola', label: 'Ativar módulo por escola' },
        { id: 'desativar_modulos_escola', label: 'Desativar módulo por escola' },
      ]},
      { permissoes: [
        { id: 'configuracoes_sistema', label: 'Configurações do sistema (Turnos)' },
      ]},
    ]
  },
  {
    grupo: 'Cadastros',
    subgrupos: [
      { nome: 'Escolas', permissoes: [
        { id: 'visualizar_escolas', label: 'Visualizar escolas' },
        { id: 'criar_escolas', label: 'Criar escolas' },
        { id: 'editar_escolas', label: 'Editar escolas' },
        { id: 'excluir_escolas', label: 'Excluir escolas' },
        { id: 'ativar_escolas', label: 'Ativar/desativar escolas' },
      ]},
      { nome: 'Redes', permissoes: [
        { id: 'visualizar_redes', label: 'Visualizar redes' },
        { id: 'criar_redes', label: 'Criar redes' },
        { id: 'editar_redes', label: 'Editar redes' },
        { id: 'excluir_redes', label: 'Excluir redes' },
      ]},
      { nome: 'Turmas', permissoes: [
        { id: 'visualizar_turmas', label: 'Visualizar turmas' },
        { id: 'criar_turmas', label: 'Criar turmas' },
        { id: 'editar_turmas', label: 'Editar turmas' },
        { id: 'excluir_turmas', label: 'Excluir turmas' },
      ]},
      { nome: 'Disciplinas', permissoes: [
        { id: 'visualizar_disciplinas', label: 'Visualizar disciplinas' },
        { id: 'criar_disciplinas', label: 'Criar disciplinas' },
        { id: 'editar_disciplinas', label: 'Editar disciplinas' },
        { id: 'excluir_disciplinas', label: 'Excluir disciplinas' },
      ]},
      { nome: 'Professores', permissoes: [
        { id: 'visualizar_professores', label: 'Visualizar professores' },
        { id: 'criar_professores', label: 'Criar professores' },
        { id: 'editar_professores', label: 'Editar professores' },
        { id: 'excluir_professores', label: 'Excluir professores' },
      ]},
    ]
  },
  {
    grupo: 'Matrículas',
    subgrupos: [
      { nome: 'Alunos', permissoes: [
        { id: 'visualizar_alunos', label: 'Visualizar alunos' },
        { id: 'criar_alunos', label: 'Criar alunos' },
        { id: 'editar_alunos', label: 'Editar alunos' },
        { id: 'excluir_alunos', label: 'Excluir alunos' },
      ]},
      { nome: 'Matrícula', permissoes: [
        { id: 'visualizar_matriculas', label: 'Visualizar matrículas' },
        { id: 'criar_matriculas', label: 'Criar matrículas' },
        { id: 'editar_matriculas', label: 'Editar matrículas' },
        { id: 'excluir_matriculas', label: 'Excluir matrículas' },
      ]},
    ]
  },
  {
    grupo: 'Horários',
    subgrupos: [{ permissoes: [
      { id: 'gerar_horarios', label: 'Gerar horários' },
      { id: 'visualizar_horarios', label: 'Visualizar horários' },
    ]}]
  },
  {
    grupo: 'Acadêmico',
    subgrupos: [{ permissoes: [
      { id: 'gerenciar_academico', label: 'Acessar módulo acadêmico' },
      { id: 'registrar_frequencia', label: 'Registrar frequência' },
      { id: 'visualizar_frequencia', label: 'Visualizar frequência' },
      { id: 'registrar_notas', label: 'Registrar notas' },
      { id: 'visualizar_notas', label: 'Visualizar notas' },
    ]}]
  },
  {
    grupo: 'Relatórios',
    subgrupos: [{ permissoes: [
      { id: 'acessar_relatorios', label: 'Acessar relatórios' },
    ]}]
  },
  {
    grupo: 'EAD',
    subgrupos: [
      { nome: 'Cursos', permissoes: [
        { id: 'visualizar_cursos_ead', label: 'Visualizar cursos EAD' },
        { id: 'criar_cursos_ead', label: 'Criar cursos EAD' },
        { id: 'editar_cursos_ead', label: 'Editar cursos EAD' },
        { id: 'excluir_cursos_ead', label: 'Excluir cursos EAD' },
      ]},
      { nome: 'Módulos', permissoes: [
        { id: 'visualizar_modulos_ead', label: 'Visualizar módulos EAD' },
        { id: 'criar_modulos_ead', label: 'Criar módulos EAD' },
        { id: 'editar_modulos_ead', label: 'Editar módulos EAD' },
        { id: 'excluir_modulos_ead', label: 'Excluir módulos EAD' },
      ]},
      { nome: 'Aulas', permissoes: [
        { id: 'visualizar_aulas_ead', label: 'Visualizar aulas EAD' },
        { id: 'criar_aulas_ead', label: 'Criar aulas EAD' },
        { id: 'editar_aulas_ead', label: 'Editar aulas EAD' },
        { id: 'excluir_aulas_ead', label: 'Excluir aulas EAD' },
      ]},
      { nome: 'Matrículas', permissoes: [
        { id: 'visualizar_matriculas_ead', label: 'Visualizar matrículas EAD' },
        { id: 'criar_matriculas_ead', label: 'Criar matrículas EAD' },
        { id: 'editar_matriculas_ead', label: 'Editar matrículas EAD' },
        { id: 'excluir_matriculas_ead', label: 'Excluir matrículas EAD' },
      ]},
      { nome: 'Relatórios', permissoes: [
        { id: 'acessar_relatorios_ead', label: 'Acessar relatórios EAD' },
      ]},
    ]
  },
  {
    grupo: 'Fidelidade',
    subgrupos: [
      { nome: 'Usuários', permissoes: [
        { id: 'fidelidade_visualizar_extrato', label: 'Visualizar extrato e saldos' },
        { id: 'fidelidade_creditar_pontos', label: 'Creditar pontos' },
        { id: 'fidelidade_visualizar_resgates', label: 'Visualizar pedidos de resgate' },
        { id: 'fidelidade_gerenciar_resgates', label: 'Aprovar/cancelar resgates' },
      ]},
      { nome: 'Administrativo', permissoes: [
        { id: 'fidelidade_gerenciar_recompensas', label: 'Gerenciar recompensas' },
        { id: 'fidelidade_configurar_expiracao', label: 'Configurar expiração de pontos' },
        { id: 'fidelidade_gerenciar_eventos', label: 'Gerenciar eventos' },
      ]},
      { nome: 'Parceiros', permissoes: [
        { id: 'fidelidade_visualizar_parceiros', label: 'Visualizar parceiros e vouchers' },
        { id: 'fidelidade_gerenciar_parceiros', label: 'Gerenciar parceiros e vouchers' },
      ]},
    ]
  }
];

/** Achatada, só pra achar o label de uma permissão pelo id (badges da tabela). */
const TODAS_PERMISSOES = PERMISSOES_DISPONIVEIS.flatMap((g) => g.subgrupos.flatMap((s) => s.permissoes));

export function PerfisTab() {
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPerfil, setEditingPerfil] = useState<PerfilAcesso | null>(null);
  const [viewingPerfil, setViewingPerfil] = useState<PerfilAcesso | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEditavel, setSelectedEditavel] = useState<string>('todos');
  const [selectedFuncionalidade, setSelectedFuncionalidade] = useState<string>('todas');
  const { hasAccess, hasPermissao } = useAuth();
  const { toast } = useToast();

  const canManageProfiles = hasAccess('perfis');
  const podeCriarPerfil = hasPermissao('criar_perfis');
  const podeEditarPerfil = hasPermissao('editar_perfis');
  const podeExcluirPerfil = hasPermissao('excluir_perfis');

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

  const handleViewPerfil = (perfil: PerfilAcesso) => {
    setViewingPerfil(perfil);
    setIsViewDialogOpen(true);
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

  // Mapeamento de funcionalidades para permissões — vem do catálogo único de módulos.
  const funcionalidadeParaPermissoes = buildFuncionalidadeParaPermissoes();

  // Filtrar perfis
  const filteredPerfis = perfis.filter(perfil => {
    const matchesSearch = perfil.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perfil.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEditavel = selectedEditavel === 'todos' ||
                           (selectedEditavel === 'editavel' && perfil.editavel) ||
                           (selectedEditavel === 'nao-editavel' && !perfil.editavel);
    
    const permissoesPerfil = perfil.herdarDe 
      ? [...new Set([...getPermissoesHerdadas(perfil.herdarDe), ...perfil.permissoes])]
      : perfil.permissoes;
    
    const matchesFuncionalidade = selectedFuncionalidade === 'todas' ||
      funcionalidadeParaPermissoes[selectedFuncionalidade]?.some(perm => 
        permissoesPerfil.includes(perm)
      );
    
    return matchesSearch && matchesEditavel && matchesFuncionalidade;
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
            {podeCriarPerfil && (
              <Button onClick={handleCreatePerfil} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Novo Perfil
              </Button>
            )}
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
            <Select value={selectedFuncionalidade} onValueChange={setSelectedFuncionalidade}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filtrar por funcionalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as funcionalidades</SelectItem>
                {MODULOS.filter((m) => m.permissoes.length > 0).map((m) => (
                  <SelectItem key={m.id} value={m.idFiltroFuncionalidade || m.id}>
                    {m.emoji} {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                              const permissao = TODAS_PERMISSOES.find(p => p.id === permissaoId);
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPerfil(perfil)}
                              title="Visualizar perfil"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {perfil.editavel ? (
                              <>
                                {podeEditarPerfil && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditPerfil(perfil)}
                                    title="Editar perfil"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {podeExcluirPerfil && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePerfil(perfil.id)}
                                    title="Excluir perfil"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                title="Perfil do sistema (não editável)"
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
                <div className="mt-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <PermissoesChecklist
                    grupos={PERMISSOES_DISPONIVEIS}
                    selecionadas={editingPerfil.permissoes}
                    herdadas={permissoesHerdadas}
                    onToggle={togglePermissao}
                  />
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

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizar Perfil
            </DialogTitle>
            <DialogDescription>
              Detalhes do perfil de acesso (somente leitura)
            </DialogDescription>
          </DialogHeader>
          
          {viewingPerfil && (() => {
            const permissoesHerdadas = viewingPerfil.herdarDe ? getPermissoesHerdadas(viewingPerfil.herdarDe) : [];
            const todasPermissoes = [...new Set([...permissoesHerdadas, ...viewingPerfil.permissoes])];
            const perfilPai = viewingPerfil.herdarDe ? perfis.find(p => p.id === viewingPerfil.herdarDe) : null;
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome do Perfil</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md flex items-center gap-2">
                      <span className="font-medium capitalize">{viewingPerfil.nome}</span>
                      {!viewingPerfil.editavel && (
                        <Badge variant="secondary" className="text-xs">Sistema</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Herdar Permissões De</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md">
                      <span className="capitalize">{perfilPai?.nome || 'Nenhum'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md min-h-[60px]">
                    {viewingPerfil.descricao || 'Sem descrição'}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Usuários com este perfil</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{getUsuariosCount(viewingPerfil.id)} usuário(s)</span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-3 block">
                    Permissões ({todasPermissoes.length})
                  </Label>
                  <div className="border rounded-md p-4 bg-muted/50">
                    <PermissoesChecklist
                      grupos={PERMISSOES_DISPONIVEIS}
                      selecionadas={viewingPerfil.permissoes}
                      herdadas={permissoesHerdadas}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                setViewingPerfil(null);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createUserWithoutSignIn } from '@/lib/firebaseSecondary';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { UserProfile, UserRole, Escola, PerfilAcesso } from '@/types';
import { Edit, Trash2, Users, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const { data: escolas, loading: escolasLoading } = useFirestoreCollection<Escola>('escolas', false);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  // Verificar se o usuário tem permissão para gerenciar usuários
  const canManageUsers = userProfile?.role === 'administrador';

  useEffect(() => {
    if (canManageUsers) {
      loadUsuarios();
      loadPerfis();
    }
  }, [canManageUsers]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usuariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPerfis = async () => {
    try {
      console.log('Carregando perfis...');
      const querySnapshot = await getDocs(collection(db, 'perfis-acesso'));
      const perfisData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PerfilAcesso[];
      console.log('Perfis carregados:', perfisData);
      setPerfis(perfisData);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis de acesso.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = () => {
    setIsCreating(true);
    setNewPassword('');
    setEditingUser({
      id: '',
      nome: '',
      email: '',
      role: 'secretario',
      ativo: true,
      escolaIds: []
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setIsCreating(false);
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Validações
    if (!editingUser.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do usuário é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser.email.trim()) {
      toast({
        title: "Erro",
        description: "O email do usuário é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      toast({
        title: "Erro",
        description: "Email inválido.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isCreating) {
        // Verificar se o email já existe
        const existingUser = usuarios.find(u => u.email === editingUser.email);
        if (existingUser) {
          toast({
            title: "Erro",
            description: "Já existe um usuário com este email.",
            variant: "destructive",
          });
          return;
        }

        if (!newPassword || newPassword.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter no mínimo 6 caracteres.",
            variant: "destructive",
          });
          return;
        }

        // Criar usuário no Firebase Auth via secondary app (não desloga o admin)
        const firebaseUser = await createUserWithoutSignIn(
          editingUser.email.trim().toLowerCase(),
          newPassword
        );

        // Criar documento do usuário no Firestore com o UID do Firebase Auth
        const userData: any = {
          id: firebaseUser.uid,
          nome: editingUser.nome.trim(),
          email: editingUser.email.trim().toLowerCase(),
          role: editingUser.role,
          ativo: editingUser.ativo,
          escolaIds: editingUser.escolaIds || [],
          mustResetPassword: true,
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        const newUser = { ...userData };
        setUsuarios([...usuarios, newUser]);

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso. Ele precisará redefinir a senha no primeiro login.",
        });
      } else {
        // Atualizar usuário existente
        const updateData: any = {
          nome: editingUser.nome.trim(),
          role: editingUser.role,
          ativo: editingUser.ativo,
        };

        // Só incluir escolaIds se não for undefined
        if (editingUser.escolaIds !== undefined) {
          updateData.escolaIds = editingUser.escolaIds;
        }

        await updateDoc(doc(db, 'users', editingUser.id), updateData);

        setUsuarios(usuarios.map(u => 
          u.id === editingUser.id ? editingUser : u
        ));

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${isCreating ? 'criar' : 'atualizar'} usuário.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsuarios(usuarios.filter(u => u.id !== userId));

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    const variants = {
      administrador: 'destructive',
      diretor: 'default',
      coordenador: 'secondary',
      secretario: 'outline',
      professor: 'default'
    };
    return variants[role] as any;
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-500">Você não tem permissão para gerenciar usuários.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar usuários baseado na busca e no perfil selecionado
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || usuario.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Usuários
              </CardTitle>
              <CardDescription>
                Usuários ativos no sistema
              </CardDescription>
            </div>
            <Button onClick={handleAddUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                {perfis.map(perfil => (
                  <SelectItem key={perfil.id} value={perfil.id}>
                    {perfil.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Escolas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(usuario.role)} className="capitalize">
                      {perfis.find(p => p.id === usuario.role)?.nome || usuario.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {usuario.escolaIds && usuario.escolaIds.length > 0 ? (
                        usuario.escolaIds.map(escolaId => {
                          const escola = escolas.find(e => e.id === escolaId);
                          return escola ? (
                            <Badge key={escolaId} variant="outline" className="text-xs">
                              {escola.nome}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma escola</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? "default" : "secondary"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(usuario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(usuario.id)}
                        disabled={usuario.id === userProfile?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          setIsCreating(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Adicionar Usuário' : 'Editar Usuário'}</DialogTitle>
            <DialogDescription>
              {isCreating ? 'Preencha os dados do novo usuário.' : 'Altere as informações e permissões do usuário.'}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={editingUser.nome}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    nome: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                  disabled={!isCreating}
                  className={!isCreating ? "bg-gray-50" : ""}
                  placeholder="usuario@email.com"
                />
              </div>

              {isCreating && (
                <div>
                  <Label htmlFor="password">Senha Inicial</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O usuário será obrigado a redefinir a senha no primeiro login.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="role">Perfil de Acesso</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: UserRole) => setEditingUser({
                    ...editingUser,
                    role: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map(perfil => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Escolas Associadas</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecione as escolas que este usuário pode acessar
                </p>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                  {escolasLoading ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Carregando escolas...</p>
                    </div>
                  ) : escolas.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        📚 Nenhuma escola cadastrada
                      </p>
                      <p className="text-xs text-gray-500">
                        Cadastre escolas primeiro na aba "Escolas" antes de criar usuários
                      </p>
                    </div>
                  ) : (
                    escolas.map((escola) => (
                      <div key={escola.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                        <Checkbox
                          id={`escola-${escola.id}`}
                          checked={editingUser.escolaIds?.includes(escola.id) || false}
                          onCheckedChange={(checked) => {
                            const currentEscolas = editingUser.escolaIds || [];
                            if (checked) {
                              setEditingUser({
                                ...editingUser,
                                escolaIds: [...currentEscolas, escola.id]
                              });
                            } else {
                              setEditingUser({
                                ...editingUser,
                                escolaIds: currentEscolas.filter(id => id !== escola.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`escola-${escola.id}`} className="text-sm cursor-pointer flex-1">
                          {escola.nome}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={editingUser.ativo}
                  onCheckedChange={(checked) => setEditingUser({
                    ...editingUser,
                    ativo: checked
                  })}
                />
                <Label htmlFor="ativo">Usuário ativo</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
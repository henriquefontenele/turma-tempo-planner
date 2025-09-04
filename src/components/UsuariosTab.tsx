import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
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
import { UserProfile, UserRole, Escola } from '@/types';
import { Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // Verificar se o usuário tem permissão para gerenciar usuários
  const canManageUsers = userProfile?.role === 'administrador';

  useEffect(() => {
    if (canManageUsers) {
      loadUsuarios();
      loadEscolas();
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

  const loadEscolas = async () => {
    try {
      console.log('Carregando escolas...');
      const querySnapshot = await getDocs(collection(db, 'escolas'));
      const escolasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Escola[];
      console.log('Escolas carregadas:', escolasData);
      setEscolas(escolasData);
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      // Filtrar campos undefined para evitar erros do Firestore
      const updateData: any = {
        nome: editingUser.nome,
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

      setIsDialogOpen(false);
      setEditingUser(null);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário.",
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie os usuários do sistema e seus níveis de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(usuario.role)} className="capitalize">
                      {usuario.role}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações e permissões do usuário.
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
                  value={editingUser.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="role">Nível de Acesso</Label>
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
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="secretario">Secretário</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Escolas Associadas</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {escolas.map((escola) => (
                    <div key={escola.id} className="flex items-center space-x-2">
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
                      <Label htmlFor={`escola-${escola.id}`} className="text-sm">{escola.nome}</Label>
                    </div>
                  ))}
                  {escolas.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma escola cadastrada</p>
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
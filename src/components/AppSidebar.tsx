
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const menuGroups = [
  {
    label: 'CADASTRO',
    items: [
      { id: 'disciplinas', label: 'Disciplinas', emoji: '📚' },
      { id: 'professores', label: 'Professores', emoji: '👨‍🏫' },
      { id: 'turmas', label: 'Turmas', emoji: '🎓' },
      { id: 'escolas', label: 'Escolas', emoji: '🏫' },
      { id: 'config', label: 'Turnos', emoji: '⚙️' },
    ]
  },
  {
    label: 'USUÁRIOS',
    items: [
      { id: 'usuarios', label: 'Usuários', emoji: '👤' },
      { id: 'perfis', label: 'Perfis de Acesso', emoji: '🔒' },
    ]
  },
  {
    label: 'MATRÍCULA',
    items: [
      { id: 'alunos', label: 'Alunos', emoji: '👥' },
      { id: 'matricula', label: 'Matrícula', emoji: '📝' },
    ]
  },
  {
    label: 'EAD',
    items: [
      { id: 'cursos-ead', label: 'Cursos', emoji: '🎬' },
      { id: 'modulos-ead', label: 'Módulos', emoji: '📚' },
      { id: 'aulas-ead', label: 'Aulas', emoji: '📹' },
      { id: 'matriculas-ead', label: 'Matrículas', emoji: '👨‍💻' },
      { id: 'relatorio-ead', label: 'Relatórios', emoji: '📈' },
    ]
  },
  {
    label: 'HORÁRIO',
    items: [
      { id: 'gerador', label: 'Gerador', emoji: '🎯' },
      { id: 'horarios', label: 'Horários', emoji: '📅' },
    ]
  },
  {
    label: 'ACADÊMICO',
    items: [
      { id: 'academico', label: 'Frequência', emoji: '📋' },
      { id: 'notas', label: 'Notas', emoji: '📝' },
      { id: 'relatorio', label: 'Relatório', emoji: '📊' },
    ]
  }
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { user, userProfile, logout, hasAccess } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Filtrar grupos e itens baseado nas permissões do usuário
  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasAccess(item.id))
  })).filter(group => group.items.length > 0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="border-b bg-white p-4">
        <div className="flex flex-col gap-2">
          {!isCollapsed && (
            <button
              onClick={() => onTabChange('dashboard')}
              className="text-lg font-bold text-gray-900 flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
            >
              🎓 Sistema de Gestão Escolar
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => onTabChange('dashboard')}
              className="text-2xl hover:text-blue-600 transition-colors cursor-pointer"
            >
              🎓
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        {filteredMenuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              {!isCollapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={activeTab === item.id}
                      className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-200"
                      data-active={activeTab === item.id}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      {!isCollapsed && (
                        <span className="text-gray-700">
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t bg-white p-4">
        <div className="flex flex-col gap-3">
          {!isCollapsed && (
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="truncate">{userProfile?.nome || user?.email}</span>
              </div>
              {userProfile && (
                <span className="text-xs text-gray-500 capitalize px-5">
                  {userProfile.role}
                </span>
              )}
            </div>
          )}
          <Button 
            variant="outline" 
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

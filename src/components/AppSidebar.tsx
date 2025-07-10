
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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const tabs = [
  { id: 'disciplinas', label: '📚 Disciplinas', emoji: '📚' },
  { id: 'professores', label: '👨‍🏫 Professores', emoji: '👨‍🏫' },
  { id: 'turmas', label: '🎓 Turmas', emoji: '🎓' },
  { id: 'escolas', label: '🏫 Escolas', emoji: '🏫' },
  { id: 'matricula', label: '📝 Matrícula', emoji: '📝' },
  { id: 'alunos', label: '👥 Alunos', emoji: '👥' },
  { id: 'config', label: '⚙️ Config', emoji: '⚙️' },
  { id: 'gerador', label: '🎯 Gerador', emoji: '🎯' },
  { id: 'horarios', label: '📅 Horários', emoji: '📅' },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🎓 Sistema de Horários
            </h1>
          )}
          {isCollapsed && (
            <div className="text-2xl">🎓</div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(tab.id)}
                    isActive={activeTab === tab.id}
                    className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-200"
                    data-active={activeTab === tab.id}
                  >
                    <span className="text-lg">{tab.emoji}</span>
                    {!isCollapsed && (
                      <span className="text-gray-700">
                        {tab.label.split(' ')[1]}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-white p-4">
        <div className="flex flex-col gap-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="truncate">{user?.email}</span>
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


import { cn } from "@/lib/utils";

const tabs = [
  { id: 'escolas', label: '🏫 Escolas', emoji: '🏫' },
  { id: 'turmas', label: '🎓 Turmas', emoji: '🎓' },
  { id: 'disciplinas', label: '📚 Disciplinas', emoji: '📚' },
  { id: 'professores', label: '👨‍🏫 Professores', emoji: '👨‍🏫' },
  { id: 'alunos', label: '👥 Alunos', emoji: '👥' },
  { id: 'horarios', label: '📅 Horários', emoji: '📅' },
  { id: 'frequencia', label: '✅ Frequência', emoji: '✅' },
];

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-white p-4 rounded-lg shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2",
            activeTab === tab.id
              ? "bg-blue-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <span>{tab.emoji}</span>
          <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
        </button>
      ))}
    </div>
  );
}

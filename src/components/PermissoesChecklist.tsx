import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import type { Permissao } from '@/types';

export interface SubgrupoPermissoes {
  /** Sem nome = renderiza só a lista de checkboxes, sem cabeçalho de subgrupo. */
  nome?: string;
  permissoes: { id: Permissao; label: string }[];
}

export interface GrupoPermissoes {
  grupo: string;
  subgrupos: SubgrupoPermissoes[];
}

interface PermissoesChecklistProps {
  grupos: GrupoPermissoes[];
  /** Permissões próprias do perfil (editáveis). */
  selecionadas: Permissao[];
  /** Permissões herdadas de outro perfil (somente leitura, sempre marcadas). */
  herdadas: Permissao[];
  /**
   * Presente = modo edição (checkboxes clicáveis + botão "marcar tudo" por
   * subgrupo com mais de 1 item). Ausente = modo visualização (só mostra as
   * permissões que o perfil realmente tem, sem opção de alterar).
   */
  onToggle?: (id: Permissao) => void;
}

/**
 * Grade de permissões grupo -> subgrupo -> checkbox, compartilhada entre o
 * diálogo de criar/editar e o de visualizar perfil — antes duplicada quase
 * identicamente nos dois lugares em PerfisTab.tsx.
 */
export default function PermissoesChecklist({ grupos, selecionadas, herdadas, onToggle }: PermissoesChecklistProps) {
  const modoEdicao = !!onToggle;
  const todasSelecionadas = [...new Set([...herdadas, ...selecionadas])];

  return (
    <div className="space-y-5">
      {grupos.map((grupo) => {
        // No modo visualização, um grupo some inteiro se nenhuma das suas
        // permissões estiver marcada — evita mostrar dezenas de seções vazias.
        const grupoTemAlgumaMarcada = grupo.subgrupos.some((sub) =>
          sub.permissoes.some((p) => todasSelecionadas.includes(p.id))
        );
        if (!modoEdicao && !grupoTemAlgumaMarcada) return null;

        return (
          <div key={grupo.grupo}>
            <p className="font-semibold text-sm mb-2">{grupo.grupo}</p>
            <div className="space-y-3 pl-1">
              {grupo.subgrupos.map((sub, i) => {
                const permissoesVisiveis = modoEdicao
                  ? sub.permissoes
                  : sub.permissoes.filter((p) => todasSelecionadas.includes(p.id));
                if (permissoesVisiveis.length === 0) return null;

                const idsDoSubgrupo = sub.permissoes.map((p) => p.id);
                const todasMarcadasNoSubgrupo = idsDoSubgrupo.every((id) => todasSelecionadas.includes(id));

                return (
                  <div key={sub.nome || i} className="border-l-2 border-muted pl-3">
                    {sub.nome && (
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">{sub.nome}</p>
                        {modoEdicao && idsDoSubgrupo.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              // Marca o que falta (se nem tudo está marcado) ou desmarca as
                              // próprias (se já estava tudo marcado). Nunca mexe em herdada.
                              const vaiMarcar = !todasMarcadasNoSubgrupo;
                              idsDoSubgrupo.forEach((id) => {
                                if (herdadas.includes(id)) return;
                                const estaSelecionada = selecionadas.includes(id);
                                if (vaiMarcar && !estaSelecionada) onToggle!(id);
                                if (!vaiMarcar && estaSelecionada) onToggle!(id);
                              });
                            }}
                          >
                            {todasMarcadasNoSubgrupo ? 'Desmarcar tudo' : 'Marcar tudo'}
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {permissoesVisiveis.map((permissao) => {
                        const isHerdada = herdadas.includes(permissao.id);
                        const isSelecionada = todasSelecionadas.includes(permissao.id);

                        if (!modoEdicao) {
                          return (
                            <div key={permissao.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <Check className="h-4 w-4 text-green-600 shrink-0" />
                              <span className="text-sm">{permissao.label}</span>
                              {isHerdada && (
                                <Badge variant="outline" className="text-xs ml-auto">Herdada</Badge>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={permissao.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permissao-${permissao.id}`}
                              checked={isSelecionada}
                              onCheckedChange={() => !isHerdada && onToggle!(permissao.id)}
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
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

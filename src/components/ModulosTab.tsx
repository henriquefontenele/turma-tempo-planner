import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Escola, Rede } from '@/types';
import { MODULOS_INSTALAVEIS, alternarModuloDaRede, alternarModuloDaEscola, restaurarHerancaDaRede } from '@/lib/modulosInstalacao';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Boxes, Network, Building, RotateCcw } from 'lucide-react';

export function ModulosTab() {
  const { userProfile } = useAuth();
  // false: o operador precisa ver e gerenciar módulos de TODAS as escolas/redes,
  // não só as que estão em userProfile.escolaIds.
  const { data: redes } = useFirestoreCollection<Rede>('redes', false);
  const { data: escolas } = useFirestoreCollection<Escola>('escolas', false);
  const { toast } = useToast();
  const [redeSelecionadaId, setRedeSelecionadaId] = useState<string | null>(null);

  // Só o operador do sistema liga/desliga módulos — decisão confirmada na análise:
  // https://claude.ai/code/artifact/4346d7db-6e4c-49f8-9a7d-41ee8f5b4240
  // Reaproveita a mesma trava de UsuariosTab/PerfisTab; a Fase 5 substitui isso
  // por um papel "operador_sistema" explícito, quando o bypass por e-mail fixo
  // também for removido.
  const isOperador = userProfile?.role === 'administrador';

  if (!isOperador) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Boxes className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-500">Você não tem permissão para instalar ou remover módulos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const redeSelecionada = redes.find((r) => r.id === redeSelecionadaId) || redes[0] || null;
  const escolasDaRede = redeSelecionada
    ? escolas.filter((e) => e.redeId === redeSelecionada.id)
    : [];

  const handleToggleRede = async (moduloId: string, habilitarAtual: boolean) => {
    if (!redeSelecionada) return;
    try {
      await alternarModuloDaRede(redeSelecionada, moduloId, !habilitarAtual);
    } catch (error) {
      console.error('Erro ao atualizar módulo da rede:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o módulo da rede.', variant: 'destructive' });
    }
  };

  const handleToggleEscola = async (escola: Escola, moduloId: string, habilitarAtual: boolean) => {
    if (!redeSelecionada) return;
    try {
      await alternarModuloDaEscola(escola, moduloId, !habilitarAtual, redeSelecionada.modulosHabilitados || []);
    } catch (error) {
      console.error('Erro ao atualizar módulo da escola:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o módulo da escola.', variant: 'destructive' });
    }
  };

  const handleRestaurarHeranca = async (escolaId: string) => {
    try {
      await restaurarHerancaDaRede(escolaId);
      toast({ title: 'Restaurado', description: 'Esta escola volta a herdar os módulos da rede.' });
    } catch (error) {
      console.error('Erro ao restaurar herança da rede:', error);
      toast({ title: 'Erro', description: 'Não foi possível restaurar a herança da rede.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Boxes className="w-6 h-6" /> Instalação de Módulos
        </h2>
        <p className="text-muted-foreground">
          Ligue ou desligue módulos por rede e, quando precisar, por escola. Desligar um módulo só impede o acesso à tela —
          nenhum dado é escondido, travado ou apagado.
        </p>
      </div>

      {redes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma rede cadastrada ainda. Toda escola precisa de uma rede — cadastre uma escola em "Escolas" para criar a primeira.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          {/* Lista de redes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-4 h-4" /> Redes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {redes.map((rede) => {
                  const totalEscolas = escolas.filter((e) => e.redeId === rede.id).length;
                  const ativa = rede.id === (redeSelecionada?.id ?? redes[0]?.id);
                  return (
                    <button
                      key={rede.id}
                      onClick={() => setRedeSelecionadaId(rede.id)}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        ativa ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{rede.nome}</div>
                      <div className={`text-xs ${ativa ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {totalEscolas} escola{totalEscolas === 1 ? '' : 's'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Painel da rede selecionada */}
          {redeSelecionada && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{redeSelecionada.nome}</CardTitle>
                  <CardDescription>
                    O que estiver desligado aqui fica indisponível para todas as escolas desta rede, mesmo que uma escola
                    tente ligar por conta própria.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MODULOS_INSTALAVEIS.map((modulo) => {
                      const habilitado = (redeSelecionada.modulosHabilitados || []).includes(modulo.id);
                      return (
                        <div key={modulo.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                          <span className="text-sm flex items-center gap-2">
                            <span>{modulo.emoji}</span> {modulo.label}
                          </span>
                          <Switch checked={habilitado} onCheckedChange={() => handleToggleRede(modulo.id, habilitado)} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="w-4 h-4" /> Escolas desta rede
                  </CardTitle>
                  <CardDescription>
                    Por padrão, cada escola herda exatamente o que a rede libera. Abra uma escola para desligar um módulo
                    só para ela — nunca é possível ligar algo que a rede não libera.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {escolasDaRede.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma escola nesta rede ainda.</p>
                  ) : (
                    <Accordion type="multiple" className="w-full">
                      {escolasDaRede.map((escola) => {
                        const personalizada = Array.isArray(escola.modulosHabilitados);
                        const modulosEfetivos = escola.modulosHabilitados ?? redeSelecionada.modulosHabilitados ?? [];
                        return (
                          <AccordionItem key={escola.id} value={escola.id}>
                            <AccordionTrigger className="text-sm">
                              <span className="flex items-center gap-2">
                                {escola.nome}
                                {personalizada ? (
                                  <Badge variant="outline" className="font-normal">personalizada</Badge>
                                ) : (
                                  <Badge variant="secondary" className="font-normal">herdando da rede</Badge>
                                )}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex justify-end mb-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={!personalizada}
                                  onClick={() => handleRestaurarHeranca(escola.id)}
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurar herança da rede
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {MODULOS_INSTALAVEIS.map((modulo) => {
                                  const habilitadoNaRede = (redeSelecionada.modulosHabilitados || []).includes(modulo.id);
                                  const habilitadoNaEscola = modulosEfetivos.includes(modulo.id);
                                  return (
                                    <div
                                      key={modulo.id}
                                      className={`flex items-center justify-between gap-2 p-2 rounded-md border ${
                                        !habilitadoNaRede ? 'opacity-50' : ''
                                      }`}
                                    >
                                      <span className="text-sm flex items-center gap-2">
                                        <span>{modulo.emoji}</span> {modulo.label}
                                      </span>
                                      <Switch
                                        checked={habilitadoNaEscola}
                                        disabled={!habilitadoNaRede}
                                        onCheckedChange={() => handleToggleEscola(escola, modulo.id, habilitadoNaEscola)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Evento, CheckinEvento } from '@/types/eventos';
import { useAuth } from '@/hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, QrCode, Trash2, Edit, Users, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EventosTab() {
  const { user } = useAuth();
  const { data: eventos, addItem, updateItem, deleteItem } = useFirestoreCollection<Evento>('eventos', true);
  const { data: checkins } = useFirestoreCollection<CheckinEvento>('checkins-eventos', true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [checkinsDialogOpen, setCheckinsDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [eventoQR, setEventoQR] = useState<Evento | null>(null);
  const [eventoCheckins, setEventoCheckins] = useState<Evento | null>(null);

  const [form, setForm] = useState({
    nome: '',
    data: '',
    local: '',
    pontosCreditar: 10,
    descricao: '',
    status: 'agendado' as Evento['status'],
  });

  const resetForm = () => {
    setForm({ nome: '', data: '', local: '', pontosCreditar: 10, descricao: '', status: 'agendado' });
    setEditando(null);
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.data || !form.local || !form.pontosCreditar) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      if (editando) {
        await updateItem(editando.id, {
          ...form,
        });
        toast({ title: 'Evento atualizado com sucesso!' });
      } else {
        const id = crypto.randomUUID();
        const qrCodeData = JSON.stringify({ eventoId: id, tipo: 'checkin-evento' });
        const novoEvento: Evento = {
          id,
          ...form,
          qrCodeData,
          criadoPor: user?.uid || '',
          dataCriacao: new Date().toISOString(),
        };
        await addItem(novoEvento);
        toast({ title: 'Evento criado com sucesso!' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Erro ao salvar evento', variant: 'destructive' });
    }
  };

  const handleEditar = (evento: Evento) => {
    setEditando(evento);
    setForm({
      nome: evento.nome,
      data: evento.data,
      local: evento.local,
      pontosCreditar: evento.pontosCreditar,
      descricao: evento.descricao || '',
      status: evento.status,
    });
    setDialogOpen(true);
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      await deleteItem(id);
      toast({ title: 'Evento excluído' });
    }
  };

  const handleVerQR = (evento: Evento) => {
    setEventoQR(evento);
    setQrDialogOpen(true);
  };

  const handleVerCheckins = (evento: Evento) => {
    setEventoCheckins(evento);
    setCheckinsDialogOpen(true);
  };

  const handleImprimirQR = () => {
    const svgEl = document.getElementById('qr-code-print');
    if (!svgEl || !eventoQR) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code - ${eventoQR.nome}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}
      h1{font-size:24px;margin-bottom:8px;}p{font-size:16px;color:#666;margin:4px 0;}</style></head>
      <body>
        <h1>${eventoQR.nome}</h1>
        <p>📅 ${new Date(eventoQR.data).toLocaleDateString('pt-BR')}</p>
        <p>📍 ${eventoQR.local}</p>
        <p>🏆 ${eventoQR.pontosCreditar} pontos</p>
        <div style="margin:24px 0">${svgData}</div>
        <p style="font-size:12px;color:#999">Escaneie para fazer check-in</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const statusBadge = (status: Evento['status']) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      agendado: { label: 'Agendado', variant: 'outline' },
      em_andamento: { label: 'Em Andamento', variant: 'default' },
      finalizado: { label: 'Finalizado', variant: 'secondary' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
    };
    const info = map[status] || map.agendado;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const checkinsDoEvento = eventoCheckins ? checkins.filter(c => c.eventoId === eventoCheckins.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Eventos</h2>
          <p className="text-muted-foreground">Gerencie eventos e QR Codes para check-in automático</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
              <DialogDescription>{editando ? 'Edite as informações do evento' : 'Preencha os dados para criar um novo evento'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Evento *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Reunião de Pais" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data *</Label>
                  <Input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                </div>
                <div>
                  <Label>Pontos a Creditar *</Label>
                  <Input type="number" min={1} value={form.pontosCreditar} onChange={e => setForm({ ...form, pontosCreditar: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Local *</Label>
                <Input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} placeholder="Ex: Auditório Principal" />
              </div>
              {editando && (
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Evento['status'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição opcional do evento" />
              </div>
              <Button onClick={handleSalvar} className="w-full">
                {editando ? 'Atualizar' : 'Criar Evento e Gerar QR Code'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {eventos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum evento cadastrado</p>
            <p className="text-sm text-muted-foreground">Crie um evento para gerar um QR Code de check-in</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map(evento => {
                  const totalCheckins = checkins.filter(c => c.eventoId === evento.id).length;
                  return (
                    <TableRow key={evento.id}>
                      <TableCell className="font-medium">{evento.nome}</TableCell>
                      <TableCell>{new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell>{evento.local}</TableCell>
                      <TableCell><Badge variant="outline">🏆 {evento.pontosCreditar}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleVerCheckins(evento)}>
                          <Users className="w-4 h-4 mr-1" /> {totalCheckins}
                        </Button>
                      </TableCell>
                      <TableCell>{statusBadge(evento.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="icon" onClick={() => handleVerQR(evento)} title="Ver QR Code">
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleEditar(evento)} title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleExcluir(evento.id)} title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code do Evento</DialogTitle>
            <DialogDescription>Escaneie o QR Code para fazer check-in no evento</DialogDescription>
          </DialogHeader>
          {eventoQR && (
            <div className="flex flex-col items-center gap-4">
              <h3 className="font-semibold text-lg">{eventoQR.nome}</h3>
              <p className="text-sm text-muted-foreground">📅 {new Date(eventoQR.data).toLocaleDateString('pt-BR')} • 📍 {eventoQR.local}</p>
              <p className="text-sm">🏆 {eventoQR.pontosCreditar} pontos por check-in</p>
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG id="qr-code-print" value={eventoQR.qrCodeData} size={256} level="H" />
              </div>
              <Button variant="outline" onClick={handleImprimirQR} className="w-full">
                <Printer className="w-4 h-4 mr-2" /> Imprimir QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkins Dialog */}
      <Dialog open={checkinsDialogOpen} onOpenChange={setCheckinsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Check-ins - {eventoCheckins?.nome}</DialogTitle>
            <DialogDescription>Lista de check-ins realizados neste evento</DialogDescription>
          </DialogHeader>
          {checkinsDoEvento.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum check-in realizado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkinsDoEvento.map(checkin => (
                  <TableRow key={checkin.id}>
                    <TableCell>{checkin.usuarioNome}</TableCell>
                    <TableCell>{checkin.usuarioEmail}</TableCell>
                    <TableCell>{new Date(checkin.dataCheckin).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

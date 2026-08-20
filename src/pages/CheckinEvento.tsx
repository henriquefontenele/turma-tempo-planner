import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Camera, CheckCircle, XCircle, QrCode, LogIn } from 'lucide-react';
import { Evento, CheckinEvento as CheckinType } from '@/types/eventos';
import { Html5Qrcode } from 'html5-qrcode';
import { Login } from '@/components/Login';

export default function CheckinEventoPage() {
  const { user, userProfile, loading } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [resultado, setResultado] = useState<'sucesso' | 'erro' | 'duplicado' | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [eventoInfo, setEventoInfo] = useState<Evento | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const iniciarScanner = async () => {
    setResultado(null);
    setMensagem('');
    setEventoInfo(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await processarQRCode(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      setScanning(false);
      setResultado('erro');
      setMensagem('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const pararScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setScanning(false);
  };

  const processarQRCode = async (data: string) => {
    try {
      const parsed = JSON.parse(data);

      if (parsed.tipo !== 'checkin-evento' || !parsed.eventoId) {
        setResultado('erro');
        setMensagem('QR Code inválido. Este código não corresponde a um evento.');
        return;
      }

      // Buscar evento
      const eventoDoc = await getDoc(doc(db, 'eventos', parsed.eventoId));
      if (!eventoDoc.exists()) {
        setResultado('erro');
        setMensagem('Evento não encontrado.');
        return;
      }

      const evento = { id: eventoDoc.id, ...eventoDoc.data() } as Evento;
      setEventoInfo(evento);

      if (evento.status === 'cancelado') {
        setResultado('erro');
        setMensagem('Este evento foi cancelado.');
        return;
      }

      if (evento.status === 'finalizado') {
        setResultado('erro');
        setMensagem('Este evento já foi finalizado.');
        return;
      }

      // ID determinístico "{eventoId}_{uid}" — permite checar duplicidade com
      // um getDoc direto (em vez de query) e é o que a regra do Firestore usa
      // pra provar, sem confiar em mais nada vindo do cliente, que este
      // check-in é genuíno e só pode acontecer uma vez (create falha se o doc
      // já existir). Ver firestore.rules: fidelidade_transacoes.
      const checkinId = `${evento.id}_${user!.uid}`;
      const checkinRef = doc(db, 'checkins-eventos', checkinId);
      const checkinExistente = await getDoc(checkinRef);

      if (checkinExistente.exists()) {
        setResultado('duplicado');
        setMensagem('Você já fez check-in neste evento!');
        return;
      }

      // Realizar check-in
      const checkin: Omit<CheckinType, 'id'> = {
        eventoId: evento.id,
        usuarioId: user!.uid,
        usuarioNome: userProfile?.nome || user!.email || '',
        usuarioEmail: user!.email || '',
        pontosCreditar: evento.pontosCreditar,
        dataCheckin: new Date().toISOString(),
      };

      await setDoc(checkinRef, checkin);

      // Creditar pontos no programa de fidelidade. O registro de fidelidade é
      // gravado com o mesmo UID da conta do sistema, então buscamos direto
      // pelo UID em vez de comparar e-mail — evita o falso-positivo de
      // "check-in deu pontos" quando o e-mail cadastrado divergia por
      // digitação/capitalização, e some com o problema de qual conta
      // creditar quando há e-mails duplicados.
      //
      // O responsável fazendo o próprio check-in não tem (nem deveria ter)
      // permissão de staff. A regra abre uma exceção estreita e autoatendida
      // só pra registrar a TRANSAÇÃO (ID determinístico, só pode ser criada
      // uma vez, valor travado no que o evento credita, exige o check-in já
      // existir) — isso já garante um registro auditável e correto. Mas
      // ATUALIZAR o saldo em cache de fidelidade_usuarios continua exigindo
      // staff/permissão de propósito: um increment livre sem essa trava seria
      // fabricável direto pelo cliente. Por isso os dois passos são
      // separados: a transação quase sempre é registrada, o saldo em si só
      // reflete na hora se quem faz o check-in for staff (ex.: alguém da
      // secretaria escaneando pro responsável) — senão fica para conciliação
      // manual, e a UI avisa isso explicitamente em vez de fingir que creditou.
      let transacaoRegistrada = false;
      let saldoAtualizado = false;
      try {
        const fidUsuarioRef = doc(db, 'fidelidade_usuarios', user!.uid);
        const fidUsuarioSnap = await getDoc(fidUsuarioRef);

        if (fidUsuarioSnap.exists()) {
          await setDoc(doc(db, 'fidelidade_transacoes', checkinId), {
            usuarioId: user!.uid,
            tipo: 'credito',
            quantidade: evento.pontosCreditar,
            descricao: `Check-in: ${evento.nome}`,
            categoria: 'participacao',
            referenciaId: evento.id,
            criadoPor: 'sistema',
            dataCriacao: new Date().toISOString(),
          });
          transacaoRegistrada = true;

          try {
            await updateDoc(fidUsuarioRef, {
              saldoPontos: increment(evento.pontosCreditar),
              pontosTotaisAcumulados: increment(evento.pontosCreditar),
            });
            saldoAtualizado = true;
          } catch (e) {
            // Esperado quando quem faz check-in é o próprio responsável (sem
            // permissão de staff) — a transação acima já ficou registrada.
            console.warn('Transação registrada, mas saldo em cache não pôde ser atualizado agora:', e);
          }
        }
      } catch (e) {
        console.warn('Check-in não pôde ser vinculado ao programa de fidelidade:', e);
      }

      setResultado('sucesso');
      setMensagem(
        saldoAtualizado
          ? `Check-in realizado! Você ganhou ${evento.pontosCreditar} pontos.`
          : transacaoRegistrada
            ? `Check-in realizado! O crédito de ${evento.pontosCreditar} pontos foi registrado e será confirmado no seu saldo pela secretaria em breve.`
            : 'Check-in realizado! (Você não está cadastrado no programa de fidelidade, então nenhum ponto foi creditado.)'
      );
    } catch (err) {
      console.error('Erro ao processar QR Code:', err);
      setResultado('erro');
      setMensagem('QR Code inválido ou erro ao processar.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">📱 Check-in de Evento</h1>
          <p className="text-muted-foreground text-sm mt-1">Escaneie o QR Code do evento para registrar presença</p>
        </div>

        {resultado === null && !scanning && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <QrCode className="w-16 h-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Aponte a câmera para o QR Code exibido no evento
              </p>
              <Button size="lg" onClick={iniciarScanner} className="w-full">
                <Camera className="w-5 h-5 mr-2" /> Abrir Scanner
              </Button>
            </CardContent>
          </Card>
        )}

        {scanning && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
              <Button variant="outline" onClick={pararScanner} className="w-full">
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {resultado === 'sucesso' && (
          <Card className="border-green-500">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-bold text-green-700">Check-in Realizado!</h2>
              {eventoInfo && (
                <div className="text-center space-y-1">
                  <p className="font-medium">{eventoInfo.nome}</p>
                  <p className="text-sm text-muted-foreground">📍 {eventoInfo.local}</p>
                </div>
              )}
              <p className="text-lg font-semibold text-green-600">{mensagem}</p>
              <Button onClick={() => { setResultado(null); setEventoInfo(null); }} className="w-full mt-4">
                Escanear Outro Evento
              </Button>
            </CardContent>
          </Card>
        )}

        {resultado === 'duplicado' && (
          <Card className="border-yellow-500">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <XCircle className="w-16 h-16 text-yellow-500" />
              <h2 className="text-xl font-bold text-yellow-700">Check-in Duplicado</h2>
              {eventoInfo && <p className="font-medium">{eventoInfo.nome}</p>}
              <p className="text-muted-foreground text-center">{mensagem}</p>
              <Button onClick={() => { setResultado(null); setEventoInfo(null); }} variant="outline" className="w-full mt-4">
                Escanear Outro Evento
              </Button>
            </CardContent>
          </Card>
        )}

        {resultado === 'erro' && (
          <Card className="border-red-500">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <XCircle className="w-16 h-16 text-red-500" />
              <h2 className="text-xl font-bold text-red-700">Erro</h2>
              <p className="text-muted-foreground text-center">{mensagem}</p>
              <Button onClick={() => { setResultado(null); setEventoInfo(null); }} variant="outline" className="w-full mt-4">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

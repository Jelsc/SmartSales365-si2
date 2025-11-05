import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download, X, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from './ui/alert-dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    if (standalone) {
      console.log('✅ PWA: Ya está instalada (modo standalone)');
      return;
    }

    // Intentar capturar el evento de instalación
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      console.log('💾 PWA: Evento de instalación capturado (localhost)');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Si no está instalada, mostrar el botón después de 2 segundos
    // (incluso si no hay evento beforeinstallprompt)
    const timer = setTimeout(() => {
      if (!standalone && !showInstallButton) {
        setShowInstallButton(true);
        console.log('💾 PWA: Botón de instalación mostrado (red local/producción)');
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [showInstallButton]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Si tenemos el evento (localhost), usar el prompt nativo
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`👤 Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);

        if (outcome === 'accepted') {
          setShowInstallButton(false);
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error al mostrar prompt de instalación:', error);
        setShowInstructions(true);
      }
    } else {
      // Si no tenemos el evento (red local), mostrar instrucciones
      console.log('⚠️ PWA: Mostrando instrucciones manuales (no localhost)');
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    console.log('❌ PWA: Botón de instalación ocultado por el usuario');
  };

  // No mostrar si ya está instalada
  if (isStandalone) return null;

  // No mostrar hasta que se active
  if (!showInstallButton) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white shadow-lg rounded-lg p-3 border-2 border-blue-500">
        <Download className="h-5 w-5 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Instalar SmartSales365</span>
          <span className="text-xs text-gray-600">
            Úsala sin conexión
          </span>
        </div>
        <Button 
          onClick={handleInstallClick} 
          size="sm" 
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          Instalar
        </Button>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Dialog con instrucciones de instalación */}
      <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Cómo instalar SmartSales365
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-4">
              <div>
                <p className="font-semibold mb-2">📱 En Chrome/Edge (Desktop):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Presiona <kbd className="px-2 py-1 bg-gray-100 rounded">F12</kbd> para abrir DevTools</li>
                  <li>Ve a la pestaña <strong>Application</strong></li>
                  <li>Click en <strong>Manifest</strong> en el menú izquierdo</li>
                  <li>Click en el botón <strong>"Install app"</strong></li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-2">🌐 Alternativa (Chrome/Edge):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Click en el menú <strong>⋮</strong> (arriba a la derecha)</li>
                  <li>Busca <strong>"Instalar SmartSales365..."</strong></li>
                  <li>Click para instalar</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-2">🍎 En Safari (iOS):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Presiona el botón <strong>Compartir</strong> (□↑)</li>
                  <li>Selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
                  <li>Confirma la instalación</li>
                </ol>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Nota:</strong> Para acceso desde red local (172.18.0.1, 192.168.0.7), 
                  usa las instrucciones manuales de DevTools (F12 → Application → Manifest).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

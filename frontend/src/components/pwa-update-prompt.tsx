import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Download, X } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registrado:', r);
    },
    onRegisterError(error) {
      console.log('Error al registrar Service Worker:', error);
    },
  });

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setShowPrompt(true);
    }
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="shadow-lg border-2">
        <Download className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          {needRefresh ? 'Nueva versión disponible' : 'App lista para usar sin conexión'}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={close}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          {needRefresh ? (
            <>
              <p className="mb-3">Hay una nueva versión de SmartSales365 disponible.</p>
              <div className="flex gap-2">
                <Button onClick={handleUpdate} size="sm">
                  Actualizar ahora
                </Button>
                <Button onClick={close} variant="outline" size="sm">
                  Más tarde
                </Button>
              </div>
            </>
          ) : (
            <p>La aplicación está lista para funcionar sin conexión.</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecognitionProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  onTranscript,
  onError,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Verificar soporte de Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    // Configurar reconocimiento de voz
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'es-ES'; // Español
    recognitionInstance.continuous = false; // Solo una frase
    recognitionInstance.interimResults = false; // Solo resultados finales
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Transcripción:', transcript);
      onTranscript(transcript);
      setIsListening(false);
      toast.success('Comando de voz capturado');
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Error de reconocimiento:', event.error);
      setIsListening(false);
      
      // Ignorar error "no-speech" ya que es común y no crítico
      if (event.error === 'no-speech') {
        toast.info('No se detectó voz. Intenta de nuevo.');
        return;
      }
      
      let errorMsg = 'Error en reconocimiento de voz';
      switch (event.error) {
        case 'audio-capture':
          errorMsg = 'No se pudo acceder al micrófono';
          break;
        case 'not-allowed':
          errorMsg = 'Permiso de micrófono denegado';
          break;
        case 'aborted':
          // Ignorar, el usuario detuvo manualmente
          return;
        default:
          errorMsg = `Error: ${event.error}`;
      }
      
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onTranscript, onError]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast.info('Escucha detenida');
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast.info('Escuchando... Habla ahora');
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        toast.error('Error al iniciar el micrófono');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Reconocimiento de voz no soportado en este navegador.
        <br />
        Prueba con Chrome o Edge.
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size="lg"
      onClick={toggleListening}
      className={className}
      disabled={!recognition}
    >
      {isListening ? (
        <>
          <MicOff className="w-5 h-5 mr-2 animate-pulse" />
          Detener Escucha
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 mr-2" />
          Usar Voz
        </>
      )}
    </Button>
  );
};

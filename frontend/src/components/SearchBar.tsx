import { useState, useEffect, useRef } from "react";
import { Search, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className = "", placeholder = "Buscar productos, marcas y más..." }: SearchBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'es-ES';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        
        // Buscar automáticamente después de la captura de voz
        if (transcript.trim()) {
          navigate(`/buscar?q=${encodeURIComponent(transcript)}`);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          toast.error('No se detectó ninguna voz. Intenta de nuevo.');
        } else if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado. Habilita el micrófono en la configuración del navegador.');
        } else {
          toast.error('Error al capturar la voz. Intenta de nuevo.');
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleVoiceSearch = () => {
    if (!recognition) {
      toast.error('Tu navegador no soporta búsqueda por voz. Prueba con Chrome o Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      toast.info('Escuchando... Di lo que quieres buscar');
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex items-center ${className}`}>
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-20 text-gray-700 bg-white border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        
        {/* Botón de voz */}
        <Button
          type="button"
          size="icon"
          onClick={toggleVoiceSearch}
          disabled={!recognition}
          className={`absolute right-11 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full transition-colors ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-blue-600'
          }`}
          variant="ghost"
          title={recognition ? "Buscar por voz" : "Búsqueda por voz no disponible"}
        >
          {isListening ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>

        {/* Botón de búsqueda */}
        <Button
          type="submit"
          size="icon"
          className="absolute right-0 h-full px-4 bg-white hover:bg-gray-50 text-gray-500 hover:text-blue-600 border-l border-gray-300 rounded-l-none rounded-r-md transition-colors"
          variant="ghost"
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}

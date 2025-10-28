// src/pages/home/Hero.tsx
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="text-center py-20 px-6 bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50">
        <motion.h2 
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-gray-800 mb-6"
        >
          Tu Viaje y Envío, Más Fácil con <span className="text-blue-700">TransMovil</span>
        </motion.h2>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Compra pasajes, reserva tus viajes, envía encomiendas y gestiona rutas de manera rápida y segura.
        </p>
        <Button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-lg">
          Comenzar Ahora
        </Button>
      </section>

   
  );
}

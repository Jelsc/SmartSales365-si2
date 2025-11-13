import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import type { ShippingData } from '../checkout.page';

interface ShippingFormProps {
  onSubmit: (data: ShippingData) => void;
}

export const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Envío</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_completo" className="mb-2">Nombre Completo *</Label>
              <Input
                id="nombre_completo"
                {...register('nombre_completo', { required: 'El nombre es requerido' })}
                placeholder="Juan Pérez"
              />
              {errors.nombre_completo && (
                <p className="text-sm text-red-600 mt-1">{errors.nombre_completo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="mb-2">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                placeholder="juan@ejemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="telefono" className="mb-2">Teléfono *</Label>
            <Input
              id="telefono"
              {...register('telefono', { required: 'El teléfono es requerido' })}
              placeholder="+591 12345678"
            />
            {errors.telefono && (
              <p className="text-sm text-red-600 mt-1">{errors.telefono.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="direccion" className="mb-2">Dirección *</Label>
            <Input
              id="direccion"
              {...register('direccion', { required: 'La dirección es requerida' })}
              placeholder="Calle Principal #123"
            />
            {errors.direccion && (
              <p className="text-sm text-red-600 mt-1">{errors.direccion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ciudad" className="mb-2">Ciudad *</Label>
              <Input
                id="ciudad"
                {...register('ciudad', { required: 'La ciudad es requerida' })}
                placeholder="La Paz"
              />
              {errors.ciudad && (
                <p className="text-sm text-red-600 mt-1">{errors.ciudad.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codigo_postal" className="mb-2">Código Postal</Label>
              <Input
                id="codigo_postal"
                {...register('codigo_postal')}
                placeholder="00000"
              />
            </div>

            <div>
              <Label htmlFor="pais" className="mb-2">Departamento *</Label>
              <Input
                id="pais"
                {...register('pais', { required: 'El departamento es requerido' })}
                placeholder="La Paz, Santa Cruz, Cochabamba..."
                defaultValue="La Paz"
              />
              {errors.pais && (
                <p className="text-sm text-red-600 mt-1">{errors.pais.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notas" className="mb-2">Notas de Entrega (Opcional)</Label>
            <Textarea
              id="notas"
              {...register('notas')}
              placeholder="Instrucciones especiales para la entrega..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/cart')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Carrito
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continuar al Pago
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

"""
Seeder para métodos de pago
"""
from .base_seeder import BaseSeeder
from pagos.models import MetodoPago


class MetodoPagoSeeder(BaseSeeder):
    """
    Seeder para crear métodos de pago iniciales
    """
    
    @classmethod
    def run(cls):
        """
        Crear métodos de pago disponibles
        """
        metodos = [
            {
                'nombre': 'Tarjeta de Crédito/Débito',
                'tipo': 'STRIPE',
                'activo': True,
                'descripcion': 'Pago seguro con tarjeta de crédito o débito a través de Stripe. Aceptamos Visa, Mastercard, American Express.',
            },
            {
                'nombre': 'PayPal',
                'tipo': 'PAYPAL',
                'activo': False,
                'descripcion': 'Pago a través de PayPal (próximamente disponible)',
            },
            {
                'nombre': 'QR Bolivia',
                'tipo': 'QR',
                'activo': False,
                'descripcion': 'Pago mediante código QR del Sistema de Pagos de Bolivia (próximamente)',
            },
            {
                'nombre': 'Transferencia Bancaria',
                'tipo': 'TRANSFERENCIA',
                'activo': True,
                'descripcion': 'Transferencia bancaria directa a nuestra cuenta. Envía el comprobante para confirmar tu pedido.',
            },
        ]
        
        contador_creados = 0
        contador_existentes = 0
        
        for metodo_data in metodos:
            metodo, created = MetodoPago.objects.get_or_create(
                tipo=metodo_data['tipo'],
                defaults=metodo_data
            )
            
            if created:
                contador_creados += 1
                estado = "✓ ACTIVO" if metodo.activo else "○ INACTIVO"
                print(f"  ✓ Creado: {metodo.nombre} - {estado}")
            else:
                contador_existentes += 1
                estado = "ACTIVO" if metodo.activo else "INACTIVO"
                print(f"  ○ Ya existe: {metodo.nombre} - {estado}")
        
        print(f"\n📊 Resumen:")
        print(f"  • Métodos creados: {contador_creados}")
        print(f"  • Métodos existentes: {contador_existentes}")
        print(f"  • Total: {contador_creados + contador_existentes}")
        
        # Estadísticas
        activos = MetodoPago.objects.filter(activo=True).count()
        inactivos = MetodoPago.objects.filter(activo=False).count()
        print(f"\n💳 Estado:")
        print(f"  • Métodos activos: {activos}")
        print(f"  • Métodos inactivos: {inactivos}")

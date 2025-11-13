"""
Seeder para generar pedidos de prueba con datos realistas.
Genera aproximadamente 1 semana de pedidos con diferentes estados y patrones.
"""
from .base_seeder import BaseSeeder
from django.contrib.auth import get_user_model
from ventas.models import Pedido, ItemPedido
from productos.models import Producto
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

User = get_user_model()


class PedidoSeeder(BaseSeeder):
    """
    Genera pedidos de ejemplo para entrenamiento del modelo ML.
    Crea ~150-200 pedidos distribuidos en 30 días con patrones realistas:
    - Más pedidos en fines de semana
    - Más pedidos en horarios pico
    - Variedad de productos y cantidades
    - Diferentes estados de pedido
    """
    
    @classmethod
    def run(cls):
        """
        Genera pedidos de los últimos 30 días
        """
        # Verificar que existan usuarios y productos
        usuarios = list(User.objects.filter(is_active=True).exclude(is_superuser=True))
        if not usuarios:
            # Si no hay usuarios normales, usar todos los activos
            usuarios = list(User.objects.filter(is_active=True))
        
        if not usuarios:
            print("❌ No hay usuarios en la base de datos. Ejecuta UserSeeder primero.")
            return
        
        productos = list(Producto.objects.filter(activo=True, stock__gt=0))
        if not productos:
            print("❌ No hay productos activos en la base de datos. Ejecuta ProductoSeeder primero.")
            return
        
        print(f"📦 Generando pedidos con {len(usuarios)} usuarios y {len(productos)} productos...")
        
        # Generar pedidos para los últimos 30 días
        pedidos_creados = 0
        items_creados = 0
        
        hoy = timezone.now()
        
        for dia_offset in range(30):
            # Fecha del pedido (de hace 30 días hasta hoy)
            fecha_pedido = hoy - timedelta(days=(29 - dia_offset))
            dia_semana = fecha_pedido.weekday()  # 0=Lunes, 6=Domingo
            
            # Más pedidos en fines de semana (Viernes-Domingo)
            if dia_semana >= 4:  # Viernes, Sábado, Domingo
                cantidad_pedidos = random.randint(10, 15)
            else:  # Lunes a Jueves
                cantidad_pedidos = random.randint(5, 8)
            
            for _ in range(cantidad_pedidos):
                # Seleccionar usuario aleatorio
                usuario = random.choice(usuarios)
                
                # Crear el pedido
                pedido = cls._crear_pedido(
                    usuario=usuario,
                    productos=productos,
                    fecha_base=fecha_pedido,
                    dia_offset=dia_offset
                )
                
                if pedido:
                    pedidos_creados += 1
                    items_creados += pedido.items.count()
        
        print(f"✅ Creados {pedidos_creados} pedidos con {items_creados} items en total")
        print(f"📊 Promedio de {items_creados/pedidos_creados:.1f} items por pedido")
    
    @classmethod
    def _crear_pedido(cls, usuario, productos, fecha_base, dia_offset):
        """
        Crea un pedido individual con items aleatorios
        """
        # Hora aleatoria del día (más pedidos en horas pico: 10-14h y 18-22h)
        hora_pico = random.choice([
            random.randint(10, 14),  # Mediodía
            random.randint(18, 22),  # Noche
            random.randint(8, 23)    # Otras horas
        ])
        minuto = random.randint(0, 59)
        segundo = random.randint(0, 59)
        
        fecha_creacion = fecha_base.replace(
            hour=hora_pico,
            minute=minuto,
            second=segundo
        )
        
        # Determinar estado del pedido según antigüedad
        if dia_offset <= 1:  # Últimos 2 días
            estado = random.choice(['PENDIENTE', 'PAGADO', 'PROCESANDO', 'ENVIADO'])
        elif dia_offset <= 3:  # Días 3-4
            estado = random.choice(['PAGADO', 'PROCESANDO', 'ENVIADO', 'ENTREGADO'])
        else:  # Días 5-7 (más antiguos)
            estado = random.choice(['ENTREGADO', 'ENTREGADO', 'ENTREGADO', 'CANCELADO'])
        
        # Cantidad de items en el pedido (1-5 productos diferentes)
        cantidad_items = random.randint(1, 5)
        productos_seleccionados = random.sample(productos, min(cantidad_items, len(productos)))
        
        # Calcular totales
        subtotal = Decimal('0.00')
        items_data = []
        
        for producto in productos_seleccionados:
            cantidad = random.randint(1, 3)  # 1-3 unidades de cada producto
            precio = producto.precio_oferta if producto.en_oferta else producto.precio
            subtotal_item = precio * cantidad
            subtotal += subtotal_item
            
            items_data.append({
                'producto': producto,
                'cantidad': cantidad,
                'precio_unitario': precio,
                'subtotal': subtotal_item
            })
        
        # Calcular descuentos e impuestos
        descuento = Decimal('0.00')
        if random.random() < 0.3:  # 30% de pedidos con descuento
            descuento = subtotal * Decimal(str(random.choice([0.05, 0.10, 0.15, 0.20])))
        
        impuestos = (subtotal - descuento) * Decimal('0.13')  # 13% IVA
        
        costo_envio = Decimal('0.00')
        if subtotal < 500:  # Envío gratis sobre 500
            costo_envio = Decimal('50.00')
        
        total = subtotal - descuento + impuestos + costo_envio
        
        # Crear pedido
        try:
            pedido = Pedido.objects.create(
                usuario=usuario,
                estado=estado,
                subtotal=subtotal,
                descuento=descuento,
                impuestos=impuestos,
                costo_envio=costo_envio,
                total=total,
                notas_cliente=cls._generar_nota_cliente() if random.random() < 0.2 else '',
            )
            
            # Actualizar fecha de creación manualmente usando SQL raw
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE ventas_pedido SET creado = %s WHERE id = %s",
                    [fecha_creacion, pedido.id]
                )
            
            # Recargar el pedido para obtener la fecha actualizada
            pedido.refresh_from_db()
            
            # Actualizar fechas según estado
            if estado == 'PAGADO':
                pedido.pagado_en = fecha_creacion + timedelta(minutes=random.randint(1, 30))
            elif estado == 'PROCESANDO':
                pedido.pagado_en = fecha_creacion + timedelta(minutes=random.randint(1, 30))
            elif estado == 'ENVIADO':
                pedido.pagado_en = fecha_creacion + timedelta(minutes=random.randint(1, 30))
                pedido.enviado_en = fecha_creacion + timedelta(hours=random.randint(1, 24))
            elif estado == 'ENTREGADO':
                pedido.pagado_en = fecha_creacion + timedelta(minutes=random.randint(1, 30))
                pedido.enviado_en = fecha_creacion + timedelta(hours=random.randint(1, 24))
                pedido.entregado_en = fecha_creacion + timedelta(days=random.randint(1, 3))
            
            pedido.save()
            
            # Crear items del pedido
            for item_data in items_data:
                ItemPedido.objects.create(
                    pedido=pedido,
                    producto=item_data['producto'],
                    nombre_producto=item_data['producto'].nombre,
                    sku=item_data['producto'].sku or '',
                    precio_unitario=item_data['precio_unitario'],
                    cantidad=item_data['cantidad'],
                    subtotal=item_data['subtotal']
                )
            
            return pedido
            
        except Exception as e:
            print(f"⚠️ Error creando pedido: {str(e)}")
            return None
    
    @classmethod
    def _generar_nota_cliente(cls):
        """Genera notas de cliente aleatorias"""
        notas = [
            "Por favor entregar en la mañana",
            "Dejar en portería si no estoy",
            "Llamar antes de entregar",
            "Es un regalo, envolver por favor",
            "Urgente, necesito antes del viernes",
            "Incluir factura",
            "Primera vez comprando aquí",
            "Cliente frecuente - gracias!",
            "Verificar fecha de vencimiento",
            "Confirmar disponibilidad antes de enviar"
        ]
        return random.choice(notas)
    
    @classmethod
    def should_run(cls):
        """
        Solo ejecutar si no hay muchos pedidos ya
        """
        pedidos_count = Pedido.objects.count()
        if pedidos_count > 50:
            print(f"⏭️ Ya existen {pedidos_count} pedidos. Omitiendo PedidoSeeder.")
            return False
        return True

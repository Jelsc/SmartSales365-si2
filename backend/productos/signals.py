"""
Signals para el modelo Producto
Notificaciones automáticas cuando cambia el stock
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.cache import cache
from .models import Producto
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Producto)
def producto_pre_save(sender, instance, **kwargs):
    """Guardar el stock anterior antes de guardar"""
    if instance.pk:
        try:
            producto_anterior = Producto.objects.get(pk=instance.pk)
            instance._stock_anterior = producto_anterior.stock
        except Producto.DoesNotExist:
            instance._stock_anterior = instance.stock
    else:
        instance._stock_anterior = instance.stock


@receiver(post_save, sender=Producto)
def producto_post_save(sender, instance, created, **kwargs):
    """Notificar cambios importantes en productos"""
    
    # Usar cache para evitar notificaciones duplicadas (15 minutos)
    cache_key_stock = f'producto_notificado_stock_{instance.id}_{instance.stock}'
    cache_key_creado = f'producto_notificado_creado_{instance.id}'
    
    try:
        from notifications.utils import (
            notificar_producto_bajo_stock,
            notificar_producto_sin_stock,
            notificar_stock_restaurado,
            notificar_nuevo_producto
        )
        
        stock_anterior = getattr(instance, '_stock_anterior', instance.stock)
        stock_actual = instance.stock
        
        # Si es un nuevo producto y está activo
        if created and instance.activo:
            # Verificar si ya se notificó
            if not cache.get(cache_key_creado):
                try:
                    # Intentar obtener el usuario que creó (si hay request context)
                    creado_por = getattr(instance, '_creado_por', None)
                    if notificar_nuevo_producto(instance, creado_por):
                        cache.set(cache_key_creado, True, 900)  # 15 minutos
                except Exception as e:
                    logger.warning(f'Error notificando nuevo producto: {e}')
        
        # Verificar cambios en stock (solo si no es creación)
        if not created and stock_anterior != stock_actual:
            # Verificar si ya se notificó este estado
            if cache.get(cache_key_stock):
                return
            
            # Producto sin stock (pasó de >0 a 0)
            if stock_anterior > 0 and stock_actual == 0:
                try:
                    if notificar_producto_sin_stock(instance):
                        cache.set(cache_key_stock, True, 900)  # 15 minutos
                except Exception as e:
                    logger.warning(f'Error notificando producto sin stock: {e}')
            
            # Producto con bajo stock (pasó de >= mínimo a < mínimo)
            elif stock_anterior >= instance.stock_minimo and stock_actual < instance.stock_minimo and stock_actual > 0:
                try:
                    if notificar_producto_bajo_stock(instance, stock_actual):
                        cache.set(cache_key_stock, True, 900)  # 15 minutos
                except Exception as e:
                    logger.warning(f'Error notificando producto bajo stock: {e}')
            
            # Stock restaurado (pasó de 0 a >0)
            elif stock_anterior == 0 and stock_actual > 0:
                try:
                    if notificar_stock_restaurado(instance, stock_anterior, stock_actual):
                        cache.set(cache_key_stock, True, 900)  # 15 minutos
                except Exception as e:
                    logger.warning(f'Error notificando stock restaurado: {e}')
    
    except ImportError:
        # Si el módulo de notificaciones no está disponible, solo loggear
        logger.warning('Módulo de notificaciones no disponible')
    except Exception as e:
        logger.error(f'Error en signal de producto: {e}')

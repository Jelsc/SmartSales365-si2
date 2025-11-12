from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import Carrito, ItemCarrito
from .serializers import (
    CarritoSerializer,
    ItemCarritoSerializer,
    AgregarItemCarritoSerializer,
    ActualizarItemCarritoSerializer
)
from productos.models import Producto, ProductoVariante


class CarritoViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestionar el carrito de compras
    """
    serializer_class = CarritoSerializer
    permission_classes = [IsAuthenticated]

    def get_or_create_carrito(self, request):
        """Obtener o crear carrito del usuario autenticado"""
        carrito, created = Carrito.objects.get_or_create(
            usuario=request.user
        )
        return carrito

    @action(detail=False, methods=['get'])
    def mi_carrito(self, request):
        """
        GET /api/carrito/mi_carrito/
        Obtener el carrito del usuario actual
        """
        carrito = self.get_or_create_carrito(request)
        serializer = self.get_serializer(carrito)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def agregar_item(self, request):
        """
        POST /api/carrito/agregar_item/
        Agregar un producto al carrito
        
        Body:
        {
            "producto_id": 1,
            "variante_id": 2 (opcional),
            "cantidad": 1
        }
        """
        serializer = AgregarItemCarritoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        producto_id = serializer.validated_data['producto_id']
        variante_id = serializer.validated_data.get('variante_id')
        cantidad = serializer.validated_data['cantidad']
        
        # Validar que el producto existe
        producto = get_object_or_404(Producto, id=producto_id, activo=True)
        
        # Validar variante si se especificó
        variante = None
        if variante_id:
            variante = get_object_or_404(ProductoVariante, id=variante_id, producto=producto)
        
        # Validar stock disponible
        stock_disponible = variante.stock if variante else producto.stock
        if cantidad > stock_disponible:
            return Response(
                {'error': f'Stock insuficiente. Disponible: {stock_disponible}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear carrito
        carrito = self.get_or_create_carrito(request)
        
        # Verificar si el item ya existe en el carrito
        item, created = ItemCarrito.objects.get_or_create(
            carrito=carrito,
            producto=producto,
            variante=variante,
            defaults={'cantidad': cantidad}
        )
        
        if not created:
            # Si ya existe, incrementar la cantidad
            nueva_cantidad = item.cantidad + cantidad
            if nueva_cantidad > stock_disponible:
                return Response(
                    {'error': f'Stock insuficiente. Disponible: {stock_disponible}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            item.cantidad = nueva_cantidad
            item.save()
        
        # Devolver el carrito actualizado
        carrito_serializer = CarritoSerializer(carrito)
        return Response(carrito_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='actualizar_item/(?P<item_id>[^/.]+)')
    def actualizar_item(self, request, item_id=None):
        """
        PATCH /api/carrito/actualizar_item/{item_id}/
        Actualizar la cantidad de un item del carrito
        
        Body:
        {
            "cantidad": 3
        }
        
        Si cantidad es 0, se elimina el item
        """
        serializer = ActualizarItemCarritoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cantidad = serializer.validated_data['cantidad']
        
        # Obtener el item del carrito del usuario
        carrito = self.get_or_create_carrito(request)
        item = get_object_or_404(ItemCarrito, id=item_id, carrito=carrito)
        
        if cantidad == 0:
            # Eliminar el item
            item.delete()
            message = 'Item eliminado del carrito'
        else:
            # Validar stock
            stock_disponible = item.variante.stock if item.variante else item.producto.stock
            if cantidad > stock_disponible:
                return Response(
                    {'error': f'Stock insuficiente. Disponible: {stock_disponible}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar cantidad
            item.cantidad = cantidad
            item.save()
            message = 'Cantidad actualizada'
        
        # Devolver el carrito actualizado
        carrito_serializer = CarritoSerializer(carrito)
        return Response({
            'message': message,
            'carrito': carrito_serializer.data
        })

    @action(detail=False, methods=['delete'], url_path='eliminar_item/(?P<item_id>[^/.]+)')
    def eliminar_item(self, request, item_id=None):
        """
        DELETE /api/carrito/eliminar_item/{item_id}/
        Eliminar un item del carrito
        """
        carrito = self.get_or_create_carrito(request)
        item = get_object_or_404(ItemCarrito, id=item_id, carrito=carrito)
        item.delete()
        
        carrito_serializer = CarritoSerializer(carrito)
        return Response({
            'message': 'Item eliminado del carrito',
            'carrito': carrito_serializer.data
        })

    @action(detail=False, methods=['delete'])
    def vaciar(self, request):
        """
        DELETE /api/carrito/vaciar/
        Vaciar todo el carrito
        """
        carrito = self.get_or_create_carrito(request)
        carrito.limpiar()
        
        carrito_serializer = CarritoSerializer(carrito)
        return Response({
            'message': 'Carrito vaciado',
            'carrito': carrito_serializer.data
        })

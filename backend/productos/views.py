from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Producto, Categoria
from .serializers import (
    ProductoSerializer,
    ProductoListSerializer,
    CategoriaSerializer
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de productos
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]  # Cambiar según necesidades
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrar solo activas para usuarios no autenticados
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(activo=True)
        return queryset


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos
    
    Endpoints:
    - GET /api/productos/ - Listar productos
    - POST /api/productos/ - Crear producto (admin)
    - GET /api/productos/{id}/ - Ver detalle
    - PUT /api/productos/{id}/ - Actualizar (admin)
    - DELETE /api/productos/{id}/ - Eliminar (admin)
    - GET /api/productos/destacados/ - Productos destacados
    - GET /api/productos/buscar/?q=texto - Búsqueda
    """
    queryset = Producto.objects.select_related('categoria').all()
    permission_classes = [AllowAny]  # Permitir acceso público para ver productos
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'activo', 'destacado']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
    ordering_fields = ['nombre', 'precio', 'stock', 'created_at']
    ordering = ['-destacado', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    def get_permissions(self):
        """Solo admins pueden crear, actualizar y eliminar"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar solo activos y con stock para clientes
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(activo=True)
        
        # Filtro por categoría via query param
        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        
        # Filtro por disponibilidad
        disponible = self.request.query_params.get('disponible')
        if disponible == 'true':
            queryset = queryset.filter(activo=True, stock__gt=0)
        
        return queryset

    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """
        Obtener productos destacados
        GET /api/productos/destacados/
        """
        productos = self.get_queryset().filter(destacado=True, activo=True, stock__gt=0)[:10]
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def buscar(self, request):
        """
        Búsqueda avanzada de productos
        GET /api/productos/buscar/?q=texto&min_precio=10&max_precio=100
        """
        query = request.query_params.get('q', '')
        min_precio = request.query_params.get('min_precio')
        max_precio = request.query_params.get('max_precio')
        
        queryset = self.get_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(nombre__icontains=query) |
                Q(descripcion__icontains=query) |
                Q(categoria__nombre__icontains=query)
            )
        
        if min_precio:
            queryset = queryset.filter(precio__gte=min_precio)
        
        if max_precio:
            queryset = queryset.filter(precio__lte=max_precio)
        
        # Paginación
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reducir_stock(self, request, pk=None):
        """
        Reducir stock de un producto
        POST /api/productos/{id}/reducir_stock/
        Body: {"cantidad": 5}
        """
        producto = self.get_object()
        cantidad = request.data.get('cantidad', 0)
        
        try:
            cantidad = int(cantidad)
        except ValueError:
            return Response(
                {'error': 'La cantidad debe ser un número'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if cantidad <= 0:
            return Response(
                {'error': 'La cantidad debe ser mayor a 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if producto.reducir_stock(cantidad):
            serializer = self.get_serializer(producto)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Stock insuficiente'},
                status=status.HTTP_400_BAD_REQUEST
            )


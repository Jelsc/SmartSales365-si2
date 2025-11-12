from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Categoria, Producto, ProductoImagen, ProductoVariante
from .serializers import (
    CategoriaSerializer,
    ProductoListSerializer,
    ProductoDetailSerializer,
    ProductoCreateUpdateSerializer,
    ProductoImagenSerializer,
    ProductoVarianteSerializer
)
from .filters import ProductoFilter


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de productos
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    lookup_field = 'pk'  # Usar ID por defecto
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'orden', 'creado']
    ordering = ['orden', 'nombre']
    
    def get_queryset(self):
        """Filtrar por activas solo en list, mostrar todas para admin"""
        if self.action == 'list' and not self.request.user.is_staff:
            return self.queryset.filter(activa=True)
        return self.queryset
    
    def get_object(self):
        """Permitir búsqueda por ID o slug"""
        lookup_value = self.kwargs.get(self.lookup_field)
        queryset = self.get_queryset()
        
        # Intentar buscar por ID primero
        if lookup_value and lookup_value.isdigit():
            try:
                obj = queryset.get(pk=lookup_value)
                self.check_object_permissions(self.request, obj)
                return obj
            except Categoria.DoesNotExist:
                pass
        
        # Si no es numérico o no se encontró, buscar por slug
        if lookup_value:
            try:
                obj = queryset.get(slug=lookup_value)
                self.check_object_permissions(self.request, obj)
                return obj
            except Categoria.DoesNotExist:
                pass
        
        from rest_framework.exceptions import NotFound
        raise NotFound('Categoría no encontrada')
    
    def get_permissions(self):
        """Permitir lectura pública, escritura solo autenticados"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Crear categoría con logging para debugging"""
        print("📝 CREATE - Request data:", request.data)
        print("📝 CREATE - Request FILES:", request.FILES)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Actualizar categoría con logging para debugging"""
        print("📝 UPDATE - Request data:", request.data)
        print("📝 UPDATE - Request FILES:", request.FILES)
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def productos(self, request, pk=None):
        """Obtener productos de una categoría"""
        categoria = self.get_object()
        productos = Producto.objects.filter(
            categoria=categoria, 
            activo=True
        )
        
        # Aplicar filtros adicionales
        serializer = ProductoListSerializer(
            productos, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos
    """
    queryset = Producto.objects.all()  # Permitir acceso a todos los productos
    lookup_field = 'pk'  # Usar pk por defecto para operaciones admin
    filter_backends = [
        DjangoFilterBackend, 
        filters.SearchFilter, 
        filters.OrderingFilter
    ]
    filterset_class = ProductoFilter
    search_fields = ['nombre', 'descripcion', 'marca', 'modelo', 'sku']
    ordering_fields = ['nombre', 'precio', 'creado', 'ventas', 'vistas']
    ordering = ['-creado']
    
    def get_queryset(self):
        """
        Filtrar productos según el usuario:
        - Usuarios autenticados (admin): ven todos los productos
        - Usuarios públicos: solo ven productos activos
        """
        queryset = Producto.objects.all()
        
        # Si el usuario no está autenticado, filtrar solo productos activos
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(activo=True)
        
        return queryset
    
    def get_object(self):
        """
        Obtener objeto por PK (para admin) o por slug (para frontend público)
        Esto permite usar tanto /api/productos/13/ como /api/productos/mi-producto/
        """
        lookup_value = self.kwargs.get(self.lookup_field)
        
        # Si el valor es numérico, buscar por ID
        if lookup_value and lookup_value.isdigit():
            queryset = self.get_queryset()
            try:
                obj = queryset.get(pk=int(lookup_value))
                self.check_object_permissions(self.request, obj)
                return obj
            except Producto.DoesNotExist:
                from rest_framework.exceptions import NotFound
                raise NotFound('Producto no encontrado')
        
        # Si no es numérico, buscar por slug
        queryset = self.get_queryset()
        try:
            obj = queryset.get(slug=lookup_value)
            self.check_object_permissions(self.request, obj)
            return obj
        except Producto.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Producto no encontrado')
    
    def get_serializer_class(self):
        """Usar diferentes serializers según la acción"""
        if self.action == 'list':
            return ProductoListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductoCreateUpdateSerializer
        return ProductoDetailSerializer
    
    def get_permissions(self):
        """Permitir lectura pública, escritura solo autenticados"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def retrieve(self, request, *args, **kwargs):
        """Incrementar contador de vistas al ver detalle"""
        instance = self.get_object()
        instance.vistas += 1
        instance.save(update_fields=['vistas'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """Obtener productos destacados"""
        productos = self.queryset.filter(destacado=True)[:10]
        serializer = ProductoListSerializer(
            productos, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ofertas(self, request):
        """Obtener productos en oferta"""
        productos = self.queryset.filter(en_oferta=True)
        serializer = ProductoListSerializer(
            productos, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mas_vendidos(self, request):
        """Obtener productos más vendidos"""
        productos = self.queryset.order_by('-ventas')[:10]
        serializer = ProductoListSerializer(
            productos, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def verificar_stock(self, request, slug=None):
        """Verificar disponibilidad de stock"""
        producto = self.get_object()
        cantidad = int(request.query_params.get('cantidad', 1))
        
        disponible = producto.stock >= cantidad
        return Response({
            'disponible': disponible,
            'stock_actual': producto.stock,
            'cantidad_solicitada': cantidad
        })


class ProductoImagenViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar imágenes de productos
    """
    queryset = ProductoImagen.objects.all()
    serializer_class = ProductoImagenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por producto si se proporciona"""
        queryset = self.queryset
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        return queryset.order_by('orden', '-es_principal')
    
    @action(detail=True, methods=['post'])
    def marcar_principal(self, request, pk=None):
        """Marcar una imagen como principal"""
        imagen = self.get_object()
        imagen.es_principal = True
        imagen.save()
        serializer = self.get_serializer(imagen)
        return Response(serializer.data)


class ProductoVarianteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar variantes de productos
    """
    queryset = ProductoVariante.objects.filter(activa=True)
    serializer_class = ProductoVarianteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por producto si se proporciona"""
        queryset = self.queryset
        producto_id = self.request.query_params.get('producto')
        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        return queryset

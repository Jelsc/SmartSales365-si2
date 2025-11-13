from rest_framework import status, viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import get_object_or_404
from .models import Pedido, ItemPedido, DireccionEnvio
from .serializers import (
    PedidoListSerializer,
    PedidoDetailSerializer,
    PedidoCreateSerializer,
    ActualizarEstadoPedidoSerializer,
)


class PedidoViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestionar pedidos
    """
    # Sin permission_classes aquí, se definirán por acción
    
    def get_permissions(self):
        """
        Permisos según la acción:
        - list: Solo admin (IsAdminUser)
        - create: Autenticado (IsAuthenticated)
        - mis_pedidos, detalle: Autenticado (IsAuthenticated)
        - actualizar_estado: Solo admin (IsAdminUser)
        """
        if self.action in ['list', 'actualizar_estado']:
            permission_classes = [IsAdminUser]
        elif self.action in ['create', 'mis_pedidos', 'detalle', 'rastrear']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Retornar el serializer apropiado según la acción"""
        if self.action == 'create':
            return PedidoCreateSerializer
        elif self.action == 'list' or self.action == 'mis_pedidos':
            return PedidoListSerializer
        elif self.action == 'actualizar_estado':
            return ActualizarEstadoPedidoSerializer
        return PedidoDetailSerializer
    
    def get_queryset(self):
        """Retornar pedidos según el tipo de usuario"""
        user = self.request.user
        if user.is_staff:
            # Admin puede ver todos los pedidos
            return Pedido.objects.all().select_related('usuario').prefetch_related('items', 'direccion_envio')
        else:
            # Usuarios normales solo ven sus pedidos
            return Pedido.objects.filter(usuario=user).select_related('usuario').prefetch_related('items', 'direccion_envio')
    
    def list(self, request):
        """
        GET /api/ventas/pedidos/
        Listar todos los pedidos (Admin) o pedidos del usuario
        """
        queryset = self.get_queryset().order_by('-creado')
        
        # Filtros opcionales
        estado = request.query_params.get('estado')
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        usuario_id = request.query_params.get('usuario')
        search = request.query_params.get('search')
        
        if estado:
            queryset = queryset.filter(estado=estado)
        if fecha_inicio:
            queryset = queryset.filter(creado_en__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(creado_en__lte=fecha_fin)
        if usuario_id and request.user.is_staff:
            queryset = queryset.filter(usuario_id=usuario_id)
        if search:
            queryset = queryset.filter(numero_pedido__icontains=search)
        
        # Paginación
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mis_pedidos(self, request):
        """
        GET /api/pedidos/mis_pedidos/
        Listar los pedidos del usuario actual
        """
        pedidos = self.get_queryset().order_by('-creado')
        
        # Paginación
        page = self.paginate_queryset(pedidos)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='detalle')
    def detalle(self, request, pk=None):
        """
        GET /api/pedidos/{id}/detalle/
        Obtener el detalle completo de un pedido
        """
        pedido = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = PedidoDetailSerializer(pedido, context={'request': request})
        return Response(serializer.data)
    
    def create(self, request):
        """
        POST /api/pedidos/
        Crear un nuevo pedido desde el carrito
        
        Body:
        {
            "direccion": {
                "nombre_completo": "Juan Pérez",
                "telefono": "71234567",
                "email": "juan@example.com",
                "direccion": "Calle 123",
                "referencia": "Cerca del mercado",
                "ciudad": "La Paz",
                "departamento": "La Paz",
                "codigo_postal": "0000"
            },
            "notas_cliente": "Entregar en la mañana",
            "metodo_pago": "efectivo"
        }
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        
        # Retornar los datos del serializer directamente (incluye to_representation)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def actualizar_estado(self, request, pk=None):
        """
        PATCH /api/pedidos/{id}/actualizar_estado/
        Actualizar el estado de un pedido (solo admin)
        
        Body:
        {
            "estado": "PAGADO",
            "notas_internas": "Pago verificado"
        }
        """
        pedido = get_object_or_404(Pedido, pk=pk)
        serializer = self.get_serializer(pedido, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Retornar el pedido actualizado
        detalle_serializer = PedidoDetailSerializer(pedido)
        return Response({
            'message': 'Estado actualizado exitosamente',
            'pedido': detalle_serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def rastrear(self, request, pk=None):
        """
        GET /api/pedidos/{id}/rastrear/
        Obtener información de rastreo del pedido
        """
        pedido = get_object_or_404(self.get_queryset(), pk=pk)
        
        # Construir timeline del pedido
        timeline = []
        
        if pedido.creado:
            timeline.append({
                'estado': 'PENDIENTE',
                'fecha': pedido.creado,
                'descripcion': 'Pedido recibido',
                'completado': True
            })
        
        if pedido.pagado_en:
            timeline.append({
                'estado': 'PAGADO',
                'fecha': pedido.pagado_en,
                'descripcion': 'Pago confirmado',
                'completado': True
            })
        
        if pedido.enviado_en:
            timeline.append({
                'estado': 'ENVIADO',
                'fecha': pedido.enviado_en,
                'descripcion': 'Pedido enviado',
                'completado': True
            })
        
        if pedido.entregado_en:
            timeline.append({
                'estado': 'ENTREGADO',
                'fecha': pedido.entregado_en,
                'descripcion': 'Pedido entregado',
                'completado': True
            })
        
        return Response({
            'numero_pedido': pedido.numero_pedido,
            'estado_actual': pedido.estado,
            'timeline': timeline,
            'direccion_envio': DireccionEnvio.objects.filter(pedido=pedido).values(
                'nombre_completo',
                'telefono',
                'direccion',
                'ciudad',
                'departamento'
            ).first()
        })

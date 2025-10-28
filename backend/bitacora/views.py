from django.db.models import Q
from rest_framework import viewsets, filters
from .models import Bitacora
from .serializers import BitacoraSerializer
from rest_framework.permissions import AllowAny

class BitacoraViewSet(viewsets.ModelViewSet):
    serializer_class = BitacoraSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]

    def get_queryset(self):
        queryset = Bitacora.objects.all().order_by('-fecha_hora')
        search = self.request.GET.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(accion__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(usuario__username__icontains=search) |
                Q(usuario__first_name__icontains=search) |   
                Q(usuario__last_name__icontains=search) | 
                Q(usuario__rol__nombre__icontains=search)
            )
        rol = self.request.GET.get('rol', '').strip()
        if rol:
            queryset = queryset.filter(usuario__rol__nombre__iexact=rol)

        return queryset
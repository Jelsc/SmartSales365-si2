from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet,
    ProductoViewSet,
    ProductoImagenViewSet,
    ProductoVarianteViewSet,
    FavoritoViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'imagenes', ProductoImagenViewSet, basename='producto-imagen')
router.register(r'variantes', ProductoVarianteViewSet, basename='producto-variante')
router.register(r'favoritos', FavoritoViewSet, basename='favorito')

urlpatterns = [
    path('', include(router.urls)),
]

"""
Lógica de búsqueda de productos por imagen
"""

import os
from typing import List, Dict, Tuple, Optional
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings
from PIL import Image
from io import BytesIO
from .models import Producto, ProductoImagen
from .azure_vision import AzureVisionService


class ImageSearchService:
    """Servicio para búsqueda de productos por imagen"""

    CACHE_PREFIX = "product_image_features_"
    CACHE_TIMEOUT = getattr(settings, "IMAGE_SEARCH_CACHE_TIMEOUT", 86400)
    SIMILARITY_THRESHOLD = getattr(settings, "IMAGE_SEARCH_SIMILARITY_THRESHOLD", 0.3)
    MAX_IMAGE_SIZE_BYTES = (
        getattr(settings, "IMAGE_SEARCH_MAX_IMAGE_SIZE_MB", 10) * 1024 * 1024
    )
    ALLOWED_FORMATS = getattr(
        settings, "IMAGE_SEARCH_ALLOWED_FORMATS", ["JPEG", "PNG", "WEBP"]
    )

    @classmethod
    def _get_image_features_cache_key(cls, image_path: str) -> str:
        """Generar clave de caché para features de imagen"""
        return f"{cls.CACHE_PREFIX}{image_path}"

    @classmethod
    def _get_product_image_features(
        cls, producto_imagen: ProductoImagen
    ) -> Optional[List[float]]:
        """
        Obtener features de una imagen de producto (con caché)

        Args:
            producto_imagen: Instancia de ProductoImagen

        Returns:
            Vector de características o None
        """
        if not producto_imagen.imagen:
            return None

        image_path = producto_imagen.imagen.name
        cache_key = cls._get_image_features_cache_key(image_path)

        # Intentar obtener de caché
        cached_features = cache.get(cache_key)
        if cached_features is not None:
            return cached_features

        # Si no está en caché, calcular
        try:
            # Leer imagen desde storage
            if default_storage.exists(image_path):
                image_file = default_storage.open(image_path, "rb")
                image_data = image_file.read()
                image_file.close()

                # Obtener features con Azure Vision
                if AzureVisionService.is_configured():
                    features = AzureVisionService.get_image_features_vector(image_data)
                    if features:
                        # Guardar en caché
                        cache.set(cache_key, features, ImageSearchService.CACHE_TIMEOUT)
                        return features
        except Exception as e:
            print(f"❌ Error obteniendo features de imagen {image_path}: {e}")

        return None

    @classmethod
    def _get_all_product_images(
        cls,
    ) -> List[Tuple[Producto, ProductoImagen, List[float]]]:
        """
        Obtener todas las imágenes de productos con sus features

        Returns:
            Lista de tuplas (producto, producto_imagen, features)
        """
        results = []

        # Obtener todos los productos activos
        productos = Producto.objects.filter(activo=True).select_related("categoria")

        for producto in productos:
            # Intentar con imagen principal del modelo
            if producto.imagen:
                try:
                    image_file = default_storage.open(producto.imagen.name, "rb")
                    image_data = image_file.read()
                    image_file.close()

                    if AzureVisionService.is_configured():
                        features = AzureVisionService.get_image_features_vector(
                            image_data
                        )
                        if features:
                            # Crear ProductoImagen virtual para compatibilidad
                            virtual_imagen = type(
                                "obj",
                                (object,),
                                {
                                    "imagen": producto.imagen,
                                    "id": f"virtual_{producto.id}",
                                },
                            )()
                            results.append((producto, virtual_imagen, features))
                except Exception as e:
                    print(
                        f"⚠️ Error procesando imagen principal de producto {producto.id}: {e}"
                    )

            # Procesar imágenes de ProductoImagen
            imagenes = producto.imagenes.all()
            for imagen in imagenes:
                features = cls._get_product_image_features(imagen)
                if features:
                    results.append((producto, imagen, features))

        return results

    @classmethod
    def search_by_image(cls, uploaded_image_data: bytes, limit: int = 10) -> List[Dict]:
        """
        Buscar productos similares a una imagen subida

        Args:
            uploaded_image_data: Bytes de la imagen subida
            limit: Número máximo de resultados

        Returns:
            Lista de dicts con producto y score de similitud
        """
        if not AzureVisionService.is_configured():
            return []

        # Obtener features de la imagen subida
        query_features = AzureVisionService.get_image_features_vector(
            uploaded_image_data
        )
        if not query_features:
            return []

        # Obtener todas las imágenes de productos con sus features
        product_images = cls._get_all_product_images()

        # Calcular similitud con cada producto
        similarities = []
        seen_products = set()  # Evitar duplicados del mismo producto

        for producto, imagen, features in product_images:
            if producto.id in seen_products:
                continue

            similarity = AzureVisionService.calculate_similarity(
                query_features, features
            )
            if similarity > ImageSearchService.SIMILARITY_THRESHOLD:
                similarities.append(
                    {
                        "producto": producto,
                        "similarity_score": similarity,
                        "imagen": imagen,
                    }
                )
                seen_products.add(producto.id)

        # Ordenar por similitud descendente
        similarities.sort(key=lambda x: x["similarity_score"], reverse=True)

        # Retornar top N resultados
        return similarities[:limit]

    @classmethod
    def validate_image(cls, image_data: bytes) -> Tuple[bool, Optional[str]]:
        """
        Validar que el archivo sea una imagen válida

        Args:
            image_data: Bytes de la imagen

        Returns:
            Tupla (es_valida, mensaje_error)
        """
        try:
            # Verificar tamaño máximo
            max_size = ImageSearchService.MAX_IMAGE_SIZE_BYTES
            max_size_mb = max_size / (1024 * 1024)
            if len(image_data) > max_size:
                return (
                    False,
                    f"La imagen es demasiado grande (máximo {max_size_mb:.0f}MB)",
                )

            # Verificar que sea una imagen válida
            image = Image.open(BytesIO(image_data))
            image.verify()

            # Verificar formato
            image_format = image.format
            allowed_formats = ImageSearchService.ALLOWED_FORMATS
            if image_format not in allowed_formats:
                formats_str = ", ".join(allowed_formats)
                return False, f"Formato no soportado: {image_format}. Use {formats_str}"

            return True, None

        except Exception as e:
            return False, f"Imagen inválida: {str(e)}"

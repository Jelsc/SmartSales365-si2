"""
Servicio para interactuar con Azure Computer Vision API
"""
import os
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class AzureVisionService:
    _client = None

    @classmethod
    def _get_client(cls):
        if cls._client is None:
            endpoint = settings.AZURE_VISION_ENDPOINT
            key = settings.AZURE_VISION_KEY
            if not endpoint or not key:
                logger.error("Azure Computer Vision credentials not configured.")
                return None
            try:
                cls._client = ComputerVisionClient(
                    endpoint, CognitiveServicesCredentials(key)
                )
                logger.info("Azure Computer Vision client initialized.")
            except Exception as e:
                logger.error(f"Error initializing Azure Computer Vision client: {e}")
                return None
        return cls._client

    @classmethod
    def is_configured(cls):
        return bool(settings.AZURE_VISION_ENDPOINT and settings.AZURE_VISION_KEY)

    @classmethod
    def get_image_features_vector(cls, image_data):
        """
        Extrae un vector de características de una imagen usando Azure Vision.
        
        Args:
            image_data: Bytes de la imagen
            
        Returns:
            List[float]: Vector de características o None si falla
        """
        client = cls._get_client()
        if not client:
            raise Exception("Azure Computer Vision service is not configured or failed to initialize.")

        try:
            from io import BytesIO
            # Analizar imagen para obtener características visuales
            analysis = client.analyze_image_in_stream(
                BytesIO(image_data),
                visual_features=["Tags", "Description", "Categories", "Color", "Objects"]
            )
            
            # Construir vector de características combinando diferentes aspectos
            features = []
            
            # Tags (palabras clave)
            if analysis.tags:
                tag_names = [tag.name for tag in analysis.tags]
                tag_confidence = [tag.confidence for tag in analysis.tags]
                # Normalizar confidencias
                features.extend(tag_confidence[:10])  # Top 10 tags
            
            # Descripción
            if analysis.description and analysis.description.captions:
                caption_text = analysis.description.captions[0].text.lower()
                # Convertir texto a características simples (longitud, palabras clave comunes)
                words = caption_text.split()
                features.append(len(words))
                features.append(len(caption_text))
            
            # Categorías
            if analysis.categories:
                category_names = [cat.name for cat in analysis.categories]
                category_scores = [cat.score for cat in analysis.categories]
                features.extend(category_scores[:5])  # Top 5 categorías
            
            # Color dominante
            if analysis.color:
                if analysis.color.dominant_colors:
                    features.extend(analysis.color.dominant_colors[:3])
                if analysis.color.accent_color:
                    features.append(analysis.color.accent_color)
            
            # Objetos detectados
            if analysis.objects:
                features.append(len(analysis.objects))
                object_confidence = [obj.confidence for obj in analysis.objects]
                features.extend(object_confidence[:5])  # Top 5 objetos
            
            # Rellenar con ceros si el vector es muy corto (normalización)
            while len(features) < 20:
                features.append(0.0)
            
            # Normalizar a máximo 20 características
            return features[:20]
            
        except Exception as e:
            logger.error(f"Error analyzing image with Azure Vision: {e}")
            raise

    @classmethod
    def calculate_similarity(cls, features1, features2):
        """
        Calcula la similitud entre dos vectores de características usando distancia coseno.
        
        Args:
            features1: List[float] - Primer vector de características
            features2: List[float] - Segundo vector de características
            
        Returns:
            float: Score de similitud entre 0.0 y 1.0
        """
        if not features1 or not features2:
            return 0.0
        
        # Asegurar que ambos vectores tengan la misma longitud
        max_len = max(len(features1), len(features2))
        vec1 = list(features1) + [0.0] * (max_len - len(features1))
        vec2 = list(features2) + [0.0] * (max_len - len(features2))
        
        # Calcular producto punto
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        
        # Calcular magnitudes
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0.0 or magnitude2 == 0.0:
            return 0.0
        
        # Similitud coseno
        similarity = dot_product / (magnitude1 * magnitude2)
        
        # Asegurar que esté entre 0 y 1
        return max(0.0, min(1.0, similarity))


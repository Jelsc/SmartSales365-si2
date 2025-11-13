"""
Servicio de búsqueda semántica con IA
Usa Sentence Transformers para entender el lenguaje natural
"""
import os
import pickle
from typing import List, Dict, Any
from django.conf import settings
from django.core.cache import cache

# Lazy import para no cargar el modelo en cada request
_model = None
_embeddings_cache = {}

def get_model():
    """Cargar modelo de embeddings (lazy loading)"""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            # Modelo multilingüe optimizado para español
            # Opciones:
            # - 'paraphrase-multilingual-MiniLM-L12-v2': Rápido, bueno para español
            # - 'distiluse-base-multilingual-cased-v2': Muy bueno, un poco más lento
            model_name = 'paraphrase-multilingual-MiniLM-L12-v2'
            
            # Forzar uso de CPU para evitar problemas con meta tensors
            device = 'cpu'
            _model = SentenceTransformer(model_name, device=device)
            print(f"✅ Modelo de IA cargado: {model_name} (device: {device})")
        except ImportError:
            print("⚠️ sentence-transformers no instalado. Usando búsqueda básica.")
            return None
        except Exception as e:
            print(f"❌ Error cargando modelo de IA: {e}")
            return None
    return _model


def generar_embedding(texto: str) -> List[float]:
    """
    Genera un vector embedding para un texto
    
    Args:
        texto: Texto para convertir a embedding
        
    Returns:
        Lista de floats representando el embedding
    """
    model = get_model()
    if model is None:
        return []
    
    try:
        # Generar embedding
        embedding = model.encode(texto, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        print(f"Error generando embedding: {e}")
        return []


def calcular_similitud_coseno(vec1: List[float], vec2: List[float]) -> float:
    """
    Calcula la similitud coseno entre dos vectores
    
    Returns:
        Valor entre 0 y 1 (1 = idéntico, 0 = completamente diferente)
    """
    import numpy as np
    
    if not vec1 or not vec2:
        return 0.0
    
    try:
        a = np.array(vec1)
        b = np.array(vec2)
        
        # Similitud coseno
        similitud = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        return float(similitud)
    except Exception as e:
        print(f"Error calculando similitud: {e}")
        return 0.0


def buscar_productos_semantica(query: str, productos_queryset, top_k: int = 20) -> List[Any]:
    """
    Búsqueda semántica de productos usando IA
    
    Args:
        query: Consulta en lenguaje natural ("quiero una lavadora")
        productos_queryset: QuerySet de Django con productos
        top_k: Número máximo de resultados
        
    Returns:
        Lista de productos ordenados por relevancia
        
    Raises:
        RuntimeError: Si el modelo de IA no está disponible
    """
    model = get_model()
    if model is None:
        # Lanzar excepción para forzar fallback a búsqueda básica
        print("⚠️ Modelo no disponible, forzando fallback a búsqueda básica")
        raise RuntimeError("sentence-transformers no está instalado o el modelo no pudo cargarse")
    
    # Generar embedding de la consulta
    query_embedding = generar_embedding(query)
    if not query_embedding:
        raise RuntimeError("No se pudo generar embedding para la consulta")
    
    # Calcular embeddings de productos (con caché)
    productos_con_score = []
    
    for producto in productos_queryset:
        # Crear texto combinado del producto
        texto_producto = f"{producto.nombre} {producto.descripcion or ''} {producto.marca or ''} {producto.modelo or ''}"
        if producto.categoria:
            texto_producto += f" {producto.categoria.nombre}"
        
        # Intentar obtener del caché
        cache_key = f"embedding_producto_{producto.id}_{hash(texto_producto)}"
        producto_embedding = cache.get(cache_key)
        
        if producto_embedding is None:
            # Generar embedding y guardar en caché
            producto_embedding = generar_embedding(texto_producto)
            cache.set(cache_key, producto_embedding, timeout=3600*24*7)  # 1 semana
        
        # Calcular similitud
        similitud = calcular_similitud_coseno(query_embedding, producto_embedding)
        
        productos_con_score.append({
            'producto': producto,
            'score': similitud
        })
    
    # Ordenar por score (mayor a menor)
    productos_con_score.sort(key=lambda x: x['score'], reverse=True)
    
    # Retornar top_k productos
    return [item['producto'] for item in productos_con_score[:top_k]]


def interpretar_consulta(query: str) -> Dict[str, Any]:
    """
    Interpreta la consulta del usuario y extrae intención
    
    Ejemplos:
    - "quiero una lavadora" -> tipo: electrodoméstico, item: lavadora
    - "necesito un termo de 1 litro" -> item: termo, característica: 1 litro
    - "busco laptop gaming barata" -> item: laptop, característica: gaming, filtro: barato
    
    Returns:
        Dict con la interpretación
    """
    query_lower = query.lower().strip()
    
    interpretacion = {
        'query_original': query,
        'query_limpia': query_lower,
        'palabras_clave': [],
        'tipo_producto': None,
        'caracteristicas': [],
        'filtros': {}
    }
    
    # Detectar palabras de intención (quiero, necesito, busco)
    palabras_intencion = ['quiero', 'necesito', 'busco', 'dame', 'mostrar', 'ver']
    for palabra in palabras_intencion:
        if palabra in query_lower:
            query_lower = query_lower.replace(palabra, '').strip()
    
    # Detectar artículos (un, una, uno, el, la)
    articulos = [' un ', ' una ', ' uno ', ' el ', ' la ', ' los ', ' las ']
    for articulo in articulos:
        query_lower = query_lower.replace(articulo, ' ').strip()
    
    interpretacion['query_limpia'] = ' '.join(query_lower.split())
    interpretacion['palabras_clave'] = query_lower.split()
    
    # Detectar filtros de precio
    if any(word in query_lower for word in ['barato', 'barata', 'económico', 'económica']):
        interpretacion['filtros']['precio'] = 'bajo'
    elif any(word in query_lower for word in ['caro', 'cara', 'premium', 'alta gama']):
        interpretacion['filtros']['precio'] = 'alto'
    
    # Detectar ofertas
    if any(word in query_lower for word in ['oferta', 'descuento', 'promoción', 'rebaja']):
        interpretacion['filtros']['en_oferta'] = True
    
    return interpretacion

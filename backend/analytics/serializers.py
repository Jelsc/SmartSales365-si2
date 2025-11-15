from rest_framework import serializers


class PrediccionVentaSerializer(serializers.Serializer):
    """Serializer para predicción de ventas"""
    fecha = serializers.DateField()
    dia_nombre = serializers.CharField()
    venta_estimada = serializers.FloatField()
    confianza = serializers.CharField()


class PrediccionMesSerializer(serializers.Serializer):
    """Serializer para predicción mensual"""
    mes = serializers.CharField()
    total_estimado = serializers.FloatField()
    promedio_diario = serializers.FloatField()
    predicciones_diarias = PrediccionVentaSerializer(many=True)


class ProductoTopSerializer(serializers.Serializer):
    """Serializer para productos top"""
    producto__id = serializers.IntegerField()
    producto__nombre = serializers.CharField()
    producto__categoria__nombre = serializers.CharField()
    producto__imagen = serializers.CharField(allow_null=True)
    total_vendido = serializers.IntegerField()
    ingresos_totales = serializers.FloatField()


class ProductoBajoStockSerializer(serializers.Serializer):
    """Serializer para productos con stock bajo"""
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    stock = serializers.IntegerField()
    precio = serializers.FloatField()
    imagen = serializers.CharField(allow_null=True)


class CategoriaTopSerializer(serializers.Serializer):
    """Serializer para categorías top"""
    id = serializers.IntegerField()
    nombre = serializers.CharField()
    total_ventas = serializers.IntegerField()
    ingresos = serializers.FloatField()


class MetricasEntrenamientoSerializer(serializers.Serializer):
    """Serializer para métricas del modelo ML"""
    exito = serializers.BooleanField()
    registros = serializers.IntegerField()
    train_score = serializers.FloatField()
    test_score = serializers.FloatField()
    features_importance = serializers.DictField()

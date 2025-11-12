from rest_framework import serializers
from .models import Categoria, Producto, ProductoImagen, ProductoVariante


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para categorías"""
    total_productos = serializers.SerializerMethodField()
    
    class Meta:
        model = Categoria
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'imagen', 
            'activa', 'orden', 'total_productos', 'creado', 'actualizado'
        ]
        read_only_fields = ['slug', 'creado', 'actualizado']
    
    def get_total_productos(self, obj):
        """Contador de productos activos en la categoría"""
        return obj.productos.filter(activo=True).count()
    
    def to_representation(self, instance):
        """Personalizar la representación para devolver URL completa de imagen"""
        representation = super().to_representation(instance)
        if instance.imagen:
            request = self.context.get('request')
            if request:
                representation['imagen'] = request.build_absolute_uri(instance.imagen.url)
            else:
                representation['imagen'] = instance.imagen.url
        else:
            representation['imagen'] = None
        return representation


class ProductoImagenSerializer(serializers.ModelSerializer):
    """Serializer para imágenes de productos"""
    
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen', 'es_principal', 'orden', 'alt_text', 'creado']
        read_only_fields = ['creado']


class ProductoVarianteSerializer(serializers.ModelSerializer):
    """Serializer para variantes de productos"""
    precio_total = serializers.DecimalField(
        source='get_precio_total', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = ProductoVariante
        fields = [
            'id', 'nombre', 'sku', 'precio_adicional', 'precio_total',
            'stock', 'activa', 'color', 'talla', 'material',
            'creado', 'actualizado'
        ]
        read_only_fields = ['creado', 'actualizado']


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer para listar productos (vista compacta)"""
    categoria = CategoriaSerializer(read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    categoria_id = serializers.IntegerField(source='categoria.id', read_only=True)
    imagen_principal = serializers.SerializerMethodField()
    precio_final = serializers.DecimalField(
        source='get_precio_final', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    descuento_monto = serializers.DecimalField(
        source='get_descuento_monto', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    tiene_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'slug', 'descripcion_corta', 'imagen', 'sku',
            'categoria', 'categoria_id', 'categoria_nombre',
            'precio', 'precio_final', 'en_oferta', 'precio_oferta', 
            'descuento_porcentaje', 'descuento_monto',
            'stock', 'tiene_stock', 'activo', 'destacado',
            'imagen_principal', 'meses_garantia',
            'creado', 'actualizado'
        ]
    
    def get_imagen_principal(self, obj):
        """Obtener la URL de la imagen principal (prioridad: campo imagen > ProductoImagen)"""
        # Primero intentar con el campo imagen del producto
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        
        # Si no hay imagen en el campo, buscar en ProductoImagen
        imagen = obj.imagenes.filter(es_principal=True).first()
        if imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(imagen.imagen.url)
            return imagen.imagen.url
        return None
    
    def to_representation(self, instance):
        """Personalizar la representación para devolver URL completa de imagen"""
        representation = super().to_representation(instance)
        if instance.imagen:
            request = self.context.get('request')
            if request:
                representation['imagen'] = request.build_absolute_uri(instance.imagen.url)
            else:
                representation['imagen'] = instance.imagen.url
        else:
            representation['imagen'] = None
        return representation
    
    def get_tiene_stock(self, obj):
        """Verificar si hay stock disponible"""
        return obj.tiene_stock()


class ProductoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle completo del producto"""
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source='categoria',
        write_only=True,
        required=False
    )
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    variantes = ProductoVarianteSerializer(many=True, read_only=True)
    
    precio_final = serializers.DecimalField(
        source='get_precio_final', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    descuento_monto = serializers.DecimalField(
        source='get_descuento_monto', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    tiene_stock = serializers.SerializerMethodField()
    stock_bajo = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'descripcion_corta', 'imagen',
            'categoria', 'categoria_id',
            'precio', 'precio_final', 
            'en_oferta', 'precio_oferta', 'descuento_porcentaje', 'descuento_monto',
            'fecha_inicio_oferta', 'fecha_fin_oferta',
            'stock', 'stock_minimo', 'tiene_stock', 'stock_bajo',
            'meses_garantia', 'descripcion_garantia',
            'sku', 'codigo_barras', 'marca', 'modelo', 'peso',
            'activo', 'destacado',
            'vistas', 'ventas',
            'imagenes', 'variantes',
            'creado', 'actualizado'
        ]
        read_only_fields = ['slug', 'sku', 'vistas', 'ventas', 'creado', 'actualizado']
    
    def to_representation(self, instance):
        """Personalizar la representación para devolver URL completa de imagen"""
        representation = super().to_representation(instance)
        if instance.imagen:
            request = self.context.get('request')
            if request:
                representation['imagen'] = request.build_absolute_uri(instance.imagen.url)
            else:
                representation['imagen'] = instance.imagen.url
        else:
            representation['imagen'] = None
        return representation
    
    def create(self, validated_data):
        """Crear producto"""
        return Producto.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar producto"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def get_tiene_stock(self, obj):
        """Verificar si hay stock disponible"""
        return obj.tiene_stock()
    
    def get_stock_bajo(self, obj):
        """Verificar si el stock está bajo"""
        return obj.stock_bajo()


class ProductoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear y actualizar productos (sin nested objects)"""
    
    class Meta:
        model = Producto
        fields = [
            'nombre', 'descripcion', 'descripcion_corta', 'imagen',
            'categoria',
            'precio', 'en_oferta', 'precio_oferta', 'descuento_porcentaje',
            'fecha_inicio_oferta', 'fecha_fin_oferta',
            'stock', 'stock_minimo',
            'meses_garantia', 'descripcion_garantia',
            'codigo_barras', 'marca', 'modelo', 'peso',
            'activo', 'destacado'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que precio_oferta sea menor que precio
        if data.get('en_oferta') and data.get('precio_oferta'):
            if data['precio_oferta'] >= data.get('precio', 0):
                raise serializers.ValidationError(
                    "El precio de oferta debe ser menor al precio regular"
                )
        
        # Validar fechas de oferta
        if data.get('fecha_inicio_oferta') and data.get('fecha_fin_oferta'):
            if data['fecha_inicio_oferta'] >= data['fecha_fin_oferta']:
                raise serializers.ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin"
                )
        
        return data

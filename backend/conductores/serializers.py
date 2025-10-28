from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conductor

User = get_user_model()


class ConductorSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Conductor"""
    
    # Campos calculados
    nombre_completo = serializers.CharField(read_only=True)
    licencia_vencida = serializers.BooleanField(read_only=True)
    dias_para_vencer_licencia = serializers.IntegerField(read_only=True)
    puede_conducir = serializers.BooleanField(read_only=True)
    estado_usuario = serializers.CharField(read_only=True)
    
    class Meta:
        model = Conductor
        fields = [
            'id',
            'nombre',
            'apellido',
            'fecha_nacimiento',
            'telefono',
            'email',
            'ci',
            'nro_licencia',
            'tipo_licencia',
            'fecha_venc_licencia',
            'estado',
            'experiencia_anios',
            'telefono_emergencia',
            'contacto_emergencia',
            'nombre_completo',
            'licencia_vencida',
            'dias_para_vencer_licencia',
            'puede_conducir',
            'estado_usuario',
            'ultima_ubicacion_lat',
            'ultima_ubicacion_lng',
            'ultima_actualizacion_ubicacion',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion',
            'ultima_actualizacion_ubicacion'
        ]
    
    def validate_nro_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if self.instance and self.instance.nro_licencia == value:
            return value
        
        if Conductor.objects.filter(nro_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value
    
    def validate_fecha_venc_licencia(self, value):
        """Valida que la fecha de vencimiento sea válida"""
        # Permitir fechas futuras y presentes, pero advertir si está vencida
        if value < timezone.now().date():
            # No lanzar error, solo permitir (se puede manejar en el frontend)
            pass
        return value


class ConductorCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear conductores"""
    
    class Meta:
        model = Conductor
        fields = [
            'nombre',
            'apellido',
            'fecha_nacimiento',
            'telefono',
            'email',
            'ci',
            'nro_licencia',
            'tipo_licencia',
            'fecha_venc_licencia',
            'estado',
            'experiencia_anios',
            'telefono_emergencia',
            'contacto_emergencia'
        ]
    
    def validate_nro_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if Conductor.objects.filter(nro_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value
    
    def validate_email(self, value):
        """Valida que el email sea único"""
        if Conductor.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este email."
            )
        return value
    
    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if Conductor.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con esta cédula de identidad."
            )
        return value


class ConductorUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar conductores"""
    
    class Meta:
        model = Conductor
        fields = [
            'nombre',
            'apellido',
            'fecha_nacimiento',
            'telefono',
            'email',
            'ci',
            'nro_licencia',
            'tipo_licencia',
            'fecha_venc_licencia',
            'estado',
            'experiencia_anios',
            'telefono_emergencia',
            'contacto_emergencia'
        ]
    
    def validate_nro_licencia(self, value):
        """Valida que el número de licencia sea único"""
        if self.instance and self.instance.nro_licencia == value:
            return value
        
        if Conductor.objects.filter(nro_licencia=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este número de licencia."
            )
        return value
    
    def validate_email(self, value):
        """Valida que el email sea único"""
        if self.instance and self.instance.email == value:
            return value
        
        if Conductor.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con este email."
            )
        return value
    
    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if self.instance and self.instance.ci == value:
            return value
        
        if Conductor.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un conductor con esta cédula de identidad."
            )
        return value


class ConductorUbicacionSerializer(serializers.ModelSerializer):
    """Serializer para actualizar ubicación del conductor"""
    
    class Meta:
        model = Conductor
        fields = ['ultima_ubicacion_lat', 'ultima_ubicacion_lng']
    
    def validate_ultima_ubicacion_lat(self, value):
        """Valida la latitud"""
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError(
                "La latitud debe estar entre -90 y 90 grados."
            )
        return value
    
    def validate_ultima_ubicacion_lng(self, value):
        """Valida la longitud"""
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError(
                "La longitud debe estar entre -180 y 180 grados."
            )
        return value


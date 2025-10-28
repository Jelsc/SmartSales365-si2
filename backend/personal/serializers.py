from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Personal

User = get_user_model()


class PersonalSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Personal - Refactorizado"""
    
    # Campos calculados
    nombre_completo = serializers.CharField(read_only=True)
    anos_antiguedad = serializers.IntegerField(read_only=True)
    puede_acceder_sistema = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Personal
        fields = [
            'id',
            'nombre',
            'apellido',
            'fecha_nacimiento',
            'telefono',
            'email',
            'ci',
            'codigo_empleado',
            'fecha_ingreso',
            'estado',
            'telefono_emergencia',
            'contacto_emergencia',
            'nombre_completo',
            'anos_antiguedad',
            'puede_acceder_sistema',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = [
            'id',
            'fecha_creacion',
            'fecha_actualizacion'
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value

        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value

    def validate_email(self, value):
        """Valida que el email sea único"""
        if self.instance and self.instance.email == value:
            return value

        if Personal.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un empleado con este email.")
        return value

    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if self.instance and self.instance.ci == value:
            return value

        if Personal.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con esta cédula de identidad."
            )
        return value


class PersonalCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear personal"""

    class Meta:
        model = Personal
        fields = [
            'nombre',
            'apellido',
            'fecha_nacimiento',
            'telefono',
            'email',
            'ci',
            'codigo_empleado',
            'fecha_ingreso',
            'estado',
            'telefono_emergencia',
            'contacto_emergencia'
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value

    def validate_email(self, value):
        """Valida que el email sea único"""
        if Personal.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un empleado con este email.")
        return value

    def validate_ci(self, value):
        """Valida que la CI sea única"""
        if Personal.objects.filter(ci=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con esta cédula de identidad."
            )
        return value


class PersonalUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar personal"""

    class Meta:
        model = Personal
        fields = [
            'codigo_empleado',
            'fecha_ingreso',
            'estado',
            'telefono_emergencia',
            'contacto_emergencia'
        ]

    def validate_codigo_empleado(self, value):
        """Valida que el código de empleado sea único"""
        if self.instance and self.instance.codigo_empleado == value:
            return value

        if Personal.objects.filter(codigo_empleado=value).exists():
            raise serializers.ValidationError(
                "Ya existe un empleado con este código de empleado."
            )
        return value


class PersonalEstadoSerializer(serializers.ModelSerializer):
    """Serializer para cambiar estado del empleado"""

    class Meta:
        model = Personal
        fields = ["estado"]

    def validate_estado(self, value):
        """Valida que el estado sea un booleano válido"""
        if not isinstance(value, bool):
            raise serializers.ValidationError(
                "El estado debe ser True (activo) o False (inactivo)."
            )
        return value

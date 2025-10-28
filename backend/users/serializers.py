"""
SERIALIZERS.PY - SERIALIZADORES SIMPLIFICADOS

RESPONSABILIDADES:
- Serializadores para autenticación unificada
- Serializadores para registro diferenciado
- Serializadores para gestión de usuarios
- Validaciones específicas por tipo de usuario

DIFERENCIAS CON SISTEMA ANTERIOR:
- Serializadores más simples y enfocados
- Validaciones específicas por tipo de usuario
- Menos campos opcionales
- Mejor organización por funcionalidad
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, Rol


class RolSerializer(serializers.ModelSerializer):
    """Serializer para roles"""
    class Meta:
        model = Rol
        fields = ["id", "nombre", "descripcion", "es_administrativo", "permisos", "fecha_creacion", "fecha_actualizacion"]


class UserSerializer(serializers.ModelSerializer):
    """Serializer base para usuarios"""
    rol = RolSerializer(read_only=True)
    rol_id = serializers.IntegerField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    
    # Campos calculados
    puede_acceder_admin = serializers.BooleanField(read_only=True)
    es_administrativo = serializers.BooleanField(read_only=True)
    es_cliente = serializers.BooleanField(read_only=True)
    
    # Campos para las relaciones (read/write)
    personal_id = serializers.IntegerField(required=False, allow_null=True)
    conductor_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "telefono",
            "direccion",
            "ci",
            "fecha_nacimiento",
            "rol",
            "rol_id",
            "is_staff",
            "is_active",
            "password",
            "password_confirm",
            "personal_id",
            "conductor_id",
            "puede_acceder_admin",
            "es_administrativo",
            "es_cliente",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login", "puede_acceder_admin", "es_administrativo", "es_cliente"]

    def validate(self, attrs):
        """Validaciones generales"""
        # Validar contraseñas si se proporcionan
        if 'password' in attrs and 'password_confirm' in attrs:
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError("Las contraseñas no coinciden")
        
        # Validar CI único si se proporciona
        if 'ci' in attrs and attrs['ci']:
            if CustomUser.objects.filter(ci=attrs['ci']).exists():
                raise serializers.ValidationError({"ci": "Ya existe un usuario con esta cédula de identidad"})
        
        return attrs

    def create(self, validated_data):
        """Crear un nuevo usuario"""
        password = validated_data.pop('password', None)
        password_confirm = validated_data.pop('password_confirm', None)
        rol_id = validated_data.pop('rol_id', None)
        personal_id = validated_data.pop('personal_id', None)
        conductor_id = validated_data.pop('conductor_id', None)
        
        user = CustomUser.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
        
        if rol_id:
            try:
                rol = Rol.objects.get(id=rol_id)
                user.rol = rol
            except Rol.DoesNotExist:
                pass
        
        if personal_id:
            try:
                from personal.models import Personal
                personal = Personal.objects.get(id=personal_id)
                user.personal = personal
            except:
                pass
        
        if conductor_id:
            try:
                from conductores.models import Conductor
                conductor = Conductor.objects.get(id=conductor_id)
                user.conductor = conductor
            except:
                pass
        
        user.save()
        return user

    def update(self, instance, validated_data):
        """Actualizar un usuario existente"""
        password = validated_data.pop('password', None)
        password_confirm = validated_data.pop('password_confirm', None)
        rol_id = validated_data.pop('rol_id', None)
        personal_id = validated_data.pop('personal_id', None)
        conductor_id = validated_data.pop('conductor_id', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Actualizar contraseña si se proporciona
        if password:
            instance.set_password(password)
        
        # Actualizar rol si se proporciona
        if rol_id:
            try:
                rol = Rol.objects.get(id=rol_id)
                instance.rol = rol
            except Rol.DoesNotExist:
                pass
        
        # Actualizar personal si se proporciona
        if personal_id:
            try:
                from personal.models import Personal
                personal = Personal.objects.get(id=personal_id)
                instance.personal = personal
            except:
                pass
        elif personal_id is None:  # Si se envía None, limpiar la relación
            instance.personal = None
        
        # Actualizar conductor si se proporciona
        if conductor_id:
            try:
                from conductores.models import Conductor
                conductor = Conductor.objects.get(id=conductor_id)
                instance.conductor = conductor
            except:
                pass
        elif conductor_id is None:  # Si se envía None, limpiar la relación
            instance.conductor = None
        
        instance.save()
        return instance



class ClienteRegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de clientes con verificación"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    ci = serializers.CharField(max_length=20, required=True)
    telefono = serializers.CharField(max_length=20, required=True)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "telefono",
            "direccion",
            "ci",
            "fecha_nacimiento",
        ]

    def validate(self, attrs):
        """Validaciones específicas para clientes"""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        # Validar CI único
        if CustomUser.objects.filter(ci=attrs["ci"]).exists():
            raise serializers.ValidationError({"ci": "Ya existe un usuario con esta cédula de identidad"})
        
        # Validar email único
        if CustomUser.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este email"})
        
        # Validar username único
        if CustomUser.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "Ya existe un usuario con este username"})
        
        return attrs

    def create(self, validated_data):
        """Crear usuario cliente"""
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        
        # Crear usuario
        user = CustomUser.objects.create_user(
            password=password,
            is_active=False,  # Inactivo hasta verificación
            **validated_data
        )
        
        # Asignar rol de Cliente
        try:
            cliente_rol = Rol.objects.get(nombre="Cliente")
            user.rol = cliente_rol
        except Rol.DoesNotExist:
            # Crear rol Cliente si no existe
            cliente_rol = Rol.objects.create(
                nombre="Cliente",
                descripcion="Cliente regular del sistema",
                es_administrativo=False,
                permisos=["ver_perfil", "editar_perfil", "solicitar_viaje", "ver_historial_viajes"]
            )
            user.rol = cliente_rol
        
        user.save()
        return user


class AdminCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de administradores"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    rol_id = serializers.IntegerField(required=True)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "rol_id",
            "telefono",
            "direccion",
        ]

    def validate(self, attrs):
        """Validaciones específicas para administradores"""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        # Verificar que el rol sea administrativo
        try:
            rol = Rol.objects.get(id=attrs["rol_id"])
            if not rol.es_administrativo:
                raise serializers.ValidationError({"rol_id": "El rol debe ser administrativo"})
        except Rol.DoesNotExist:
            raise serializers.ValidationError({"rol_id": "Rol no válido"})
        
        return attrs

    def create(self, validated_data):
        """Crear usuario administrativo"""
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        rol_id = validated_data.pop("rol_id")
        
        # Crear usuario
        user = CustomUser.objects.create_user(
            password=password,
            is_active=True,  # Activo inmediatamente
            is_staff=True,   # Acceso al panel administrativo
            **validated_data
        )
        
        # Asignar rol
        rol = Rol.objects.get(id=rol_id)
        user.rol = rol
        user.save()
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de usuario"""
    rol = RolSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "telefono",
            "direccion",
            "ci",
            "fecha_nacimiento",
            "rol",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "username", "date_joined", "last_login"]

    def validate_email(self, value):
        """Validar email único al actualizar"""
        if self.instance and self.instance.email != value:
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("Ya existe un usuario con este email")
        return value

    def validate_ci(self, value):
        """Validar CI única al actualizar"""
        if self.instance and self.instance.ci != value:
            if CustomUser.objects.filter(ci=value).exists():
                raise serializers.ValidationError("Ya existe un usuario con esta cédula de identidad")
        return value
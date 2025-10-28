from rest_framework import serializers
from .models import Bitacora

class BitacoraSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()

    class Meta:
        model = Bitacora
        fields = ['id', 'fecha_hora', 'usuario', 'accion', 'descripcion', 'ip', 'user_agent']

    def get_usuario(self, obj):
        if obj.usuario:
            rol_nombre = obj.usuario.rol.nombre if obj.usuario.rol else "Sin rol"
            return {
                "id": obj.usuario.id,
                "username": obj.usuario.username,
                "first_name": obj.usuario.first_name,
                "last_name": obj.usuario.last_name,
                "rol": rol_nombre
            }
        return {"username": "Sistema", "first_name": "", "last_name": "", "rol": "N/A"}
"""
Configuración del admin para el módulo de notificaciones
"""
from django.contrib import admin
from .models import DeviceToken, Notification


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    """Administración de tokens de dispositivos"""
    list_display = ['user', 'device_type', 'device_name', 'is_active', 'created_at', 'updated_at']
    list_filter = ['device_type', 'is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'token', 'device_name']
    readonly_fields = ['token', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información del dispositivo', {
            'fields': ('user', 'token', 'device_type', 'device_name')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Administración de notificaciones enviadas"""
    list_display = ['titulo', 'get_recipient', 'tipo', 'estado', 'sent_at', 'read_at']
    list_filter = ['tipo', 'estado', 'sent_at']
    search_fields = ['titulo', 'mensaje', 'user__username', 'topic']
    readonly_fields = ['message_id', 'sent_at', 'read_at', 'error_message']
    date_hierarchy = 'sent_at'
    
    fieldsets = (
        ('Destinatario', {
            'fields': ('user', 'topic')
        }),
        ('Contenido', {
            'fields': ('tipo', 'titulo', 'mensaje', 'data')
        }),
        ('Estado', {
            'fields': ('estado', 'message_id', 'error_message')
        }),
        ('Fechas', {
            'fields': ('sent_at', 'read_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')
    
    def get_recipient(self, obj):
        """Mostrar destinatario: usuario o topic"""
        if obj.user:
            return f"Usuario: {obj.user.username}"
        elif obj.topic:
            return f"Topic: {obj.topic}"
        return "Sin destinatario"
    get_recipient.short_description = 'Destinatario'
    
    actions = ['mark_as_read']
    
    def mark_as_read(self, request, queryset):
        """Acción para marcar notificaciones como leídas"""
        from django.utils import timezone
        updated = queryset.filter(estado='enviada').update(
            estado='leida',
            read_at=timezone.now()
        )
        self.message_user(request, f'{updated} notificaciones marcadas como leídas')
    mark_as_read.short_description = 'Marcar seleccionadas como leídas'

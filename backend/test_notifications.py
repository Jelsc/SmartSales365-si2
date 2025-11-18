"""
Script de ejemplo para enviar notificaciones push de prueba
Ejecutar con: python manage.py shell < test_notifications.py
O desde Django shell: exec(open('test_notifications.py').read())
"""

from notifications.models import DeviceToken, Notification
from notifications.firebase_config import (
    send_push_notification,
    send_multicast_notification,
    send_topic_notification
)
from django.contrib.auth import get_user_model

User = get_user_model()

def test_single_notification():
    """Enviar notificación a un solo dispositivo"""
    print("\n=== Test 1: Notificación a Dispositivo Único ===")
    
    # Obtener primer token activo
    token_obj = DeviceToken.objects.filter(is_active=True).first()
    
    if not token_obj:
        print("❌ No hay tokens registrados. Primero registra un dispositivo desde la app.")
        return False
    
    print(f"📱 Enviando a: {token_obj.user.username} ({token_obj.device_name})")
    
    # Crear registro
    notification = Notification.objects.create(
        user=token_obj.user,
        tipo='info',
        titulo='🧪 Test Unitario',
        mensaje='Esta es una notificación de prueba desde el backend',
        data={'test': True, 'timestamp': 'now'}
    )
    
    # Enviar
    message_id = send_push_notification(
        token_obj.token,
        '🧪 Test Unitario',
        'Esta es una notificación de prueba desde el backend',
        {'test': True, 'timestamp': 'now'}
    )
    
    if message_id:
        notification.mark_as_sent(message_id)
        print(f"✅ Notificación enviada exitosamente (ID: {message_id})")
        return True
    else:
        notification.mark_as_failed("Error al enviar")
        print("❌ Error al enviar notificación")
        return False


def test_multicast_notification():
    """Enviar notificación a múltiples dispositivos"""
    print("\n=== Test 2: Notificación Multicast ===")
    
    # Obtener todos los tokens activos
    tokens = list(DeviceToken.objects.filter(is_active=True).values_list('token', flat=True))
    
    if not tokens:
        print("❌ No hay tokens registrados")
        return False
    
    print(f"📱 Enviando a {len(tokens)} dispositivo(s)")
    
    # Enviar a todos
    response = send_multicast_notification(
        tokens,
        '📢 Notificación Masiva',
        f'Esta notificación se envió a {len(tokens)} dispositivos simultáneamente',
        {'type': 'broadcast', 'recipients': len(tokens)}
    )
    
    if response:
        print(f"✅ Enviado exitosamente a {response.success_count} dispositivos")
        print(f"❌ Falló en {response.failure_count} dispositivos")
        return True
    else:
        print("❌ Error al enviar notificaciones")
        return False


def test_topic_notification():
    """Enviar notificación a un topic"""
    print("\n=== Test 3: Notificación por Topic ===")
    
    topic = 'all_users'
    print(f"📢 Enviando a topic: {topic}")
    
    # Crear registro
    notification = Notification.objects.create(
        topic=topic,
        tipo='news',
        titulo='🎉 Anuncio General',
        mensaje='Esta es una notificación enviada a todos los usuarios suscritos',
        data={'topic': topic, 'announcement': True}
    )
    
    # Enviar
    message_id = send_topic_notification(
        topic,
        '🎉 Anuncio General',
        'Esta es una notificación enviada a todos los usuarios suscritos',
        {'topic': topic, 'announcement': True}
    )
    
    if message_id:
        notification.mark_as_sent(message_id)
        print(f"✅ Notificación enviada al topic (ID: {message_id})")
        return True
    else:
        notification.mark_as_failed("Error al enviar a topic")
        print("❌ Error al enviar notificación al topic")
        return False


def test_promo_notification():
    """Enviar notificación de promoción"""
    print("\n=== Test 4: Notificación de Promoción ===")
    
    tokens = list(DeviceToken.objects.filter(is_active=True).values_list('token', flat=True))
    
    if not tokens:
        print("❌ No hay tokens registrados")
        return False
    
    response = send_multicast_notification(
        tokens,
        '🎁 Oferta Especial',
        '50% de descuento en productos seleccionados hasta medianoche',
        {
            'type': 'promo',
            'discount': 50,
            'category': 'electronics',
            'expires': '23:59',
            'screen': 'products'
        }
    )
    
    if response:
        print(f"✅ Promoción enviada a {response.success_count} dispositivos")
        return True
    else:
        print("❌ Error al enviar promoción")
        return False


def show_stats():
    """Mostrar estadísticas del sistema"""
    print("\n=== 📊 Estadísticas del Sistema ===")
    
    # Tokens
    total_tokens = DeviceToken.objects.count()
    active_tokens = DeviceToken.objects.filter(is_active=True).count()
    android_tokens = DeviceToken.objects.filter(device_type='android', is_active=True).count()
    ios_tokens = DeviceToken.objects.filter(device_type='ios', is_active=True).count()
    
    print(f"\n📱 Dispositivos:")
    print(f"   Total: {total_tokens}")
    print(f"   Activos: {active_tokens}")
    print(f"   Android: {android_tokens}")
    print(f"   iOS: {ios_tokens}")
    
    # Notificaciones
    total_notif = Notification.objects.count()
    enviadas = Notification.objects.filter(estado='enviada').count()
    leidas = Notification.objects.filter(estado='leida').count()
    fallidas = Notification.objects.filter(estado='fallida').count()
    
    print(f"\n📬 Notificaciones:")
    print(f"   Total: {total_notif}")
    print(f"   Enviadas: {enviadas}")
    print(f"   Leídas: {leidas}")
    print(f"   Fallidas: {fallidas}")
    
    if enviadas + leidas > 0:
        tasa_lectura = (leidas / (enviadas + leidas)) * 100
        print(f"   Tasa de lectura: {tasa_lectura:.1f}%")
    
    # Por tipo
    print(f"\n📊 Por tipo:")
    for tipo_choice in ['info', 'promo', 'news', 'alert']:
        count = Notification.objects.filter(tipo=tipo_choice).count()
        print(f"   {tipo_choice}: {count}")
    
    # Últimas notificaciones
    print(f"\n📝 Últimas 5 notificaciones:")
    recent = Notification.objects.order_by('-sent_at')[:5]
    for notif in recent:
        destinatario = notif.user.username if notif.user else f"Topic: {notif.topic}"
        print(f"   - {notif.titulo} → {destinatario} ({notif.estado})")


def run_all_tests():
    """Ejecutar todos los tests"""
    print("=" * 60)
    print("🚀 INICIANDO TESTS DE NOTIFICACIONES PUSH")
    print("=" * 60)
    
    results = []
    
    # Test 1: Notificación única
    results.append(("Test Unitario", test_single_notification()))
    
    # Test 2: Multicast
    results.append(("Multicast", test_multicast_notification()))
    
    # Test 3: Topic
    results.append(("Topic", test_topic_notification()))
    
    # Test 4: Promoción
    results.append(("Promoción", test_promo_notification()))
    
    # Estadísticas
    show_stats()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE TESTS")
    print("=" * 60)
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\nTotal: {passed}/{total} tests pasados")
    print("=" * 60)


# Menú interactivo
def menu():
    """Menú interactivo para tests"""
    while True:
        print("\n" + "=" * 60)
        print("🔔 SISTEMA DE NOTIFICACIONES PUSH - MENÚ DE PRUEBAS")
        print("=" * 60)
        print("1. Enviar notificación a un dispositivo")
        print("2. Enviar notificación multicast (todos los dispositivos)")
        print("3. Enviar notificación a topic")
        print("4. Enviar notificación de promoción")
        print("5. Ver estadísticas")
        print("6. Ejecutar todos los tests")
        print("0. Salir")
        print("=" * 60)
        
        opcion = input("\nSelecciona una opción: ").strip()
        
        if opcion == '1':
            test_single_notification()
        elif opcion == '2':
            test_multicast_notification()
        elif opcion == '3':
            test_topic_notification()
        elif opcion == '4':
            test_promo_notification()
        elif opcion == '5':
            show_stats()
        elif opcion == '6':
            run_all_tests()
        elif opcion == '0':
            print("\n👋 ¡Hasta luego!\n")
            break
        else:
            print("\n❌ Opción inválida")
        
        input("\nPresiona Enter para continuar...")


# Si se ejecuta directamente, mostrar menú
if __name__ == '__main__':
    menu()
else:
    # Si se importa en Django shell, ejecutar tests automáticamente
    print("\n💡 Ejecutando tests automáticamente...")
    print("💡 Para usar el menú interactivo, ejecuta: menu()")
    run_all_tests()

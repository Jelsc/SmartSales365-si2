package com.example.mobile

import io.flutter.embedding.android.FlutterFragmentActivity

/**
 * MainActivity para SmartSales365
 * 
 * Extiende FlutterFragmentActivity (requerido por flutter_stripe)
 * en lugar de FlutterActivity para soportar Payment Sheet de Stripe.
 * 
 * Referencia: https://github.com/flutter-stripe/flutter_stripe#android
 */
class MainActivity : FlutterFragmentActivity()

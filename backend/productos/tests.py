from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from .models import Categoria, Producto, ProductoImagen, ProductoVariante


class CategoriaModelTest(TestCase):
    """Tests para el modelo Categoria"""

    def setUp(self):
        self.categoria = Categoria.objects.create(
            nombre="Electrónica",
            descripcion="Dispositivos electrónicos y accesorios",
            activa=True,
            orden=1
        )

    def test_categoria_creacion(self):
        """Test que verifica la creación correcta de una categoría"""
        self.assertEqual(self.categoria.nombre, "Electrónica")
        self.assertEqual(self.categoria.slug, "electronica")
        self.assertTrue(self.categoria.activa)
        self.assertEqual(self.categoria.orden, 1)
        self.assertIsNotNone(self.categoria.creado)
        self.assertIsNotNone(self.categoria.actualizado)

    def test_categoria_slug_auto_generado(self):
        """Test que verifica la generación automática del slug"""
        categoria = Categoria.objects.create(nombre="Ropa y Moda")
        self.assertEqual(categoria.slug, "ropa-y-moda")

    def test_categoria_str(self):
        """Test del método __str__"""
        self.assertEqual(str(self.categoria), "Electrónica")

    def test_categoria_unique_nombre(self):
        """Test que verifica que el nombre sea único"""
        with self.assertRaises(Exception):
            Categoria.objects.create(nombre="Electrónica")


class ProductoModelTest(TestCase):
    """Tests para el modelo Producto"""

    def setUp(self):
        self.categoria = Categoria.objects.create(
            nombre="Electrónica",
            activa=True
        )
        self.producto = Producto.objects.create(
            nombre="Laptop HP",
            descripcion="Laptop de alta gama",
            precio=Decimal("2500.00"),
            stock=10,
            categoria=self.categoria,
            meses_garantia=12,
            activo=True
        )

    def test_producto_creacion(self):
        """Test que verifica la creación correcta de un producto"""
        self.assertEqual(self.producto.nombre, "Laptop HP")
        self.assertEqual(self.producto.slug, "laptop-hp")
        self.assertEqual(self.producto.precio, Decimal("2500.00"))
        self.assertEqual(self.producto.stock, 10)
        self.assertEqual(self.producto.categoria, self.categoria)
        self.assertEqual(self.producto.meses_garantia, 12)
        self.assertFalse(self.producto.en_oferta)
        self.assertTrue(self.producto.activo)

    def test_producto_slug_auto_generado(self):
        """Test que verifica la generación automática del slug"""
        producto = Producto.objects.create(
            nombre="Mouse Logitech MX",
            precio=Decimal("99.99"),
            stock=5,
            categoria=self.categoria
        )
        self.assertEqual(producto.slug, "mouse-logitech-mx")

    def test_producto_precio_final_sin_oferta(self):
        """Test del precio final sin oferta"""
        self.assertEqual(self.producto.get_precio_final(), Decimal("2500.00"))

    def test_producto_precio_final_con_oferta_activa(self):
        """Test del precio final con oferta activa"""
        self.producto.en_oferta = True
        self.producto.precio_oferta = Decimal("2000.00")
        self.producto.save()
        self.assertEqual(self.producto.get_precio_final(), Decimal("2000.00"))

    def test_producto_get_descuento_monto(self):
        """Test del cálculo del monto de descuento"""
        self.producto.en_oferta = True
        self.producto.precio_oferta = Decimal("2000.00")
        self.producto.save()
        self.assertEqual(self.producto.get_descuento_monto(), Decimal("500.00"))

    def test_producto_tiene_stock(self):
        """Test del método tiene_stock"""
        self.assertTrue(self.producto.tiene_stock())
        self.producto.stock = 0
        self.producto.save()
        self.assertFalse(self.producto.tiene_stock())

    def test_producto_stock_bajo(self):
        """Test del método stock_bajo"""
        self.producto.stock = 10
        self.producto.stock_minimo = 5
        self.producto.save()
        self.assertFalse(self.producto.stock_bajo())
        
        self.producto.stock = 3
        self.producto.save()
        self.assertTrue(self.producto.stock_bajo())

    def test_producto_sku_auto_generado(self):
        """Test que verifica la generación automática del SKU"""
        producto = Producto.objects.create(
            nombre="Monitor LG",
            precio=Decimal("1200.00"),
            stock=5,
            categoria=self.categoria
        )
        self.assertTrue(producto.sku.startswith("PROD-"))

    def test_producto_garantia_validacion(self):
        """Test de validación de meses de garantía"""
        with self.assertRaises(ValidationError):
            producto = Producto(
                nombre="Producto Test",
                precio=Decimal("100.00"),
                stock=5,
                categoria=self.categoria,
                meses_garantia=-1
            )
            producto.full_clean()

    def test_producto_str(self):
        """Test del método __str__"""
        self.assertEqual(str(self.producto), "Laptop HP")


class ProductoImagenModelTest(TestCase):
    """Tests para el modelo ProductoImagen"""

    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Electrónica")
        self.producto = Producto.objects.create(
            nombre="Laptop HP",
            precio=Decimal("2500.00"),
            stock=10,
            categoria=self.categoria
        )

    def test_producto_imagen_creacion(self):
        """Test que verifica la creación de una imagen de producto"""
        imagen = ProductoImagen.objects.create(
            producto=self.producto,
            orden=1,
            es_principal=True
        )
        self.assertEqual(imagen.producto, self.producto)
        self.assertEqual(imagen.orden, 1)
        self.assertTrue(imagen.es_principal)

    def test_producto_imagen_primera_es_principal(self):
        """Test que verifica que la primera imagen se marca como principal"""
        imagen1 = ProductoImagen.objects.create(producto=self.producto)
        self.assertTrue(imagen1.es_principal)

    def test_producto_imagen_solo_una_principal(self):
        """Test que verifica que solo puede haber una imagen principal"""
        imagen1 = ProductoImagen.objects.create(
            producto=self.producto,
            es_principal=True
        )
        imagen2 = ProductoImagen.objects.create(
            producto=self.producto,
            es_principal=True
        )
        # Al guardar la segunda como principal, la primera debe desmarcarse
        imagen1.refresh_from_db()
        self.assertFalse(imagen1.es_principal)
        self.assertTrue(imagen2.es_principal)

    def test_producto_imagen_str(self):
        """Test del método __str__"""
        imagen = ProductoImagen.objects.create(producto=self.producto, orden=1)
        self.assertEqual(str(imagen), "Imagen de Laptop HP - 1")


class ProductoVarianteModelTest(TestCase):
    """Tests para el modelo ProductoVariante"""

    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Ropa")
        self.producto = Producto.objects.create(
            nombre="Camiseta",
            precio=Decimal("25.00"),
            stock=100,
            categoria=self.categoria
        )

    def test_producto_variante_creacion(self):
        """Test que verifica la creación de una variante"""
        variante = ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla M - Negro",
            sku="CAM-001-M-BK",
            precio_adicional=Decimal("0.00"),
            stock=25
        )
        self.assertEqual(variante.producto, self.producto)
        self.assertEqual(variante.nombre, "Talla M - Negro")
        self.assertEqual(variante.sku, "CAM-001-M-BK")
        self.assertEqual(variante.stock, 25)

    def test_producto_variante_precio_adicional_negativo(self):
        """Test con precio adicional negativo (descuento)"""
        variante = ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla S - Blanco",
            sku="CAM-001-S-WH",
            precio_adicional=Decimal("-5.00"),
            stock=15
        )
        self.assertEqual(variante.precio_adicional, Decimal("-5.00"))

    def test_producto_variante_sku_unico(self):
        """Test que verifica que el SKU sea único"""
        ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla M",
            sku="CAM-001-M",
            stock=10
        )
        with self.assertRaises(Exception):
            ProductoVariante.objects.create(
                producto=self.producto,
                nombre="Talla L",
                sku="CAM-001-M",
                stock=10
            )

    def test_producto_variante_unique_together(self):
        """Test que verifica unique_together de producto y nombre"""
        ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla M",
            sku="CAM-001-M",
            stock=10
        )
        with self.assertRaises(Exception):
            ProductoVariante.objects.create(
                producto=self.producto,
                nombre="Talla M",
                sku="CAM-001-M-2",
                stock=10
            )

    def test_producto_variante_get_precio_total(self):
        """Test del método get_precio_total"""
        variante = ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla XL",
            sku="CAM-001-XL",
            precio_adicional=Decimal("5.00"),
            stock=20
        )
        precio_esperado = self.producto.precio + variante.precio_adicional
        self.assertEqual(variante.get_precio_total(), precio_esperado)

    def test_producto_variante_str(self):
        """Test del método __str__"""
        variante = ProductoVariante.objects.create(
            producto=self.producto,
            nombre="Talla M - Negro",
            sku="CAM-001-M-BK",
            stock=25
        )
        self.assertEqual(str(variante), "Camiseta - Talla M - Negro")

"""
Servicio para interpretar prompts de texto y extraer parámetros de reportes
"""
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dateutil import parser as date_parser


class PromptParser:
    """
    Parser para interpretar comandos de texto y extraer:
    - Tipo de reporte (ventas, productos, clientes, etc.)
    - Rango de fechas
    - Agrupación (por producto, cliente, categoría, etc.)
    - Formato de salida (PDF, Excel, pantalla)
    - Filtros adicionales
    """
    
    # Palabras clave para tipo de reporte
    TIPOS_REPORTE = {
        'ventas': ['venta', 'ventas', 'pedido', 'pedidos', 'orden', 'ordenes'],
        'productos': ['producto', 'productos', 'artículo', 'artículos', 'item', 'items'],
        'clientes': ['cliente', 'clientes', 'comprador', 'compradores', 'usuario', 'usuarios'],
        'categorias': ['categoría', 'categorias', 'categoria'],
    }
    
    # Palabras clave para formato
    FORMATOS = {
        'pdf': ['pdf'],
        'excel': ['excel', 'xls', 'xlsx', 'hoja de cálculo', 'hoja'],
        'pantalla': ['pantalla', 'vista', 'ver', 'mostrar'],
    }
    
    # Palabras clave para agrupación
    AGRUPACIONES = {
        'producto': ['producto', 'productos'],
        'cliente': ['cliente', 'clientes', 'comprador'],
        'categoria': ['categoría', 'categoria', 'categorias'],
        'fecha': ['fecha', 'día', 'dia', 'mes', 'año'],
        'estado': ['estado'],
    }
    
    # Meses en español
    MESES = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }
    
    def parse(self, prompt: str) -> Dict:
        """
        Parsear el prompt y extraer parámetros
        
        Returns:
            {
                'tipo': 'ventas',
                'formato': 'pdf',
                'fecha_inicio': datetime,
                'fecha_fin': datetime,
                'agrupacion': ['producto'],
                'filtros': {},
                'campos': [],
                'raw_prompt': prompt
            }
        """
        prompt_lower = prompt.lower()
        
        resultado = {
            'tipo': self._detectar_tipo(prompt_lower),
            'formato': self._detectar_formato(prompt_lower),
            'fecha_inicio': None,
            'fecha_fin': None,
            'agrupacion': self._detectar_agrupacion(prompt_lower),
            'filtros': {},
            'campos': self._detectar_campos(prompt_lower),
            'raw_prompt': prompt
        }
        
        # Detectar fechas
        fecha_inicio, fecha_fin = self._detectar_fechas(prompt_lower)
        resultado['fecha_inicio'] = fecha_inicio
        resultado['fecha_fin'] = fecha_fin
        
        return resultado
    
    def _detectar_tipo(self, prompt: str) -> str:
        """Detectar el tipo de reporte solicitado"""
        for tipo, palabras in self.TIPOS_REPORTE.items():
            for palabra in palabras:
                if palabra in prompt:
                    return tipo
        return 'ventas'  # Por defecto
    
    def _detectar_formato(self, prompt: str) -> str:
        """Detectar el formato de salida"""
        for formato, palabras in self.FORMATOS.items():
            for palabra in palabras:
                if palabra in prompt:
                    return formato
        return 'pantalla'  # Por defecto
    
    def _detectar_agrupacion(self, prompt: str) -> List[str]:
        """Detectar por qué campos agrupar"""
        agrupaciones = []
        
        # Buscar "agrupado por X" o "por X"
        patrones = [
            r'agrupado por ([a-záéíóúñ]+)',
            r'agrupar por ([a-záéíóúñ]+)',
            r'por ([a-záéíóúñ]+)',
        ]
        
        for patron in patrones:
            matches = re.findall(patron, prompt)
            for match in matches:
                for key, palabras in self.AGRUPACIONES.items():
                    if match in palabras:
                        if key not in agrupaciones:
                            agrupaciones.append(key)
        
        return agrupaciones if agrupaciones else ['fecha']  # Por defecto agrupar por fecha
    
    def _detectar_campos(self, prompt: str) -> List[str]:
        """Detectar qué campos mostrar"""
        campos = []
        
        # Campos comunes
        campos_keywords = {
            'nombre_cliente': ['nombre del cliente', 'cliente'],
            'cantidad_compras': ['cantidad de compras', 'número de compras', 'compras'],
            'monto_total': ['monto total', 'total pagado', 'total'],
            'rango_fechas': ['rango de fechas', 'fechas'],
            'producto': ['producto', 'nombre del producto'],
            'cantidad': ['cantidad'],
            'precio': ['precio'],
        }
        
        for campo, keywords in campos_keywords.items():
            for keyword in keywords:
                if keyword in prompt:
                    if campo not in campos:
                        campos.append(campo)
        
        return campos
    
    def _detectar_fechas(self, prompt: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Detectar rangos de fechas en el prompt"""
        fecha_inicio = None
        fecha_fin = None
        
        # Patrón 1: "mes de [mes]"
        for mes_nombre, mes_num in self.MESES.items():
            if f'mes de {mes_nombre}' in prompt or f'de {mes_nombre}' in prompt:
                # Asumir año actual
                year = datetime.now().year
                fecha_inicio = datetime(year, mes_num, 1)
                # Último día del mes
                if mes_num == 12:
                    fecha_fin = datetime(year + 1, 1, 1)
                else:
                    fecha_fin = datetime(year, mes_num + 1, 1)
                return fecha_inicio, fecha_fin
        
        # Patrón 2: "del DD/MM/YYYY al DD/MM/YYYY"
        patron_rango = r'del?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+al?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        match = re.search(patron_rango, prompt)
        if match:
            try:
                fecha_inicio = date_parser.parse(match.group(1), dayfirst=True)
                fecha_fin = date_parser.parse(match.group(2), dayfirst=True)
                return fecha_inicio, fecha_fin
            except:
                pass
        
        # Patrón 3: "periodo del ... al ..."
        patron_periodo = r'periodo del?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+al?\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        match = re.search(patron_periodo, prompt)
        if match:
            try:
                fecha_inicio = date_parser.parse(match.group(1), dayfirst=True)
                fecha_fin = date_parser.parse(match.group(2), dayfirst=True)
                return fecha_inicio, fecha_fin
            except:
                pass
        
        # Patrón 4: "últimos N días/meses"
        patron_ultimos = r'últimos?\s+(\d+)\s+(día|dias|mes|meses)'
        match = re.search(patron_ultimos, prompt)
        if match:
            cantidad = int(match.group(1))
            unidad = match.group(2)
            fecha_fin = datetime.now()
            
            if 'dia' in unidad:
                from datetime import timedelta
                fecha_inicio = fecha_fin - timedelta(days=cantidad)
            elif 'mes' in unidad:
                from dateutil.relativedelta import relativedelta
                fecha_inicio = fecha_fin - relativedelta(months=cantidad)
            
            return fecha_inicio, fecha_fin
        
        return None, None


def interpretar_prompt(prompt: str) -> Dict:
    """
    Función helper para interpretar un prompt
    """
    parser = PromptParser()
    return parser.parse(prompt)

"""
Servicio para interpretar prompts de texto y extraer parámetros de reportes
"""
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dateutil import parser as date_parser


def detectar_multiples_reportes(prompt: str) -> List[str]:
    """
    Detecta si el prompt solicita múltiples reportes y los separa.
    
    Palabras clave:
    - "Y también", "Y además", "también quiero", "además quiero"
    - "2 reportes", "dos reportes", "3 reportes"
    - Separación con "Y" entre comandos distintos
    
    Ejemplos que separan:
    - "ventas por categoría Y productos más vendidos"
    - "ventas por cliente Y también productos top"
    - "reporte de ventas Y otro de productos"
    """
    prompt_lower = prompt.lower()
    
    # Detectar indicadores numéricos
    match_numero = re.search(r'(\d+|dos|tres|cuatro|cinco)\s+reportes?', prompt_lower)
    if match_numero:
        # Si dice explícitamente cuántos reportes
        cantidad_texto = match_numero.group(1)
        cantidad_map = {'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5}
        cantidad = cantidad_map.get(cantidad_texto, int(cantidad_texto) if cantidad_texto.isdigit() else 1)
    
    # Buscar separadores explícitos (alta confianza)
    separadores_explicitos = [
        r'\s+y\s+también\s+',
        r'\s+y\s+además\s+',
        r'\s+también\s+quiero\s+',
        r'\s+además\s+quiero\s+',
        r'\s+y\s+otro\s+',
        r'\s+y\s+segundo\s+',
        r'\s+y\s+tercero\s+',
        r'[:;]\s+',  # Dos puntos o punto y coma
    ]
    
    for separador in separadores_explicitos:
        if re.search(separador, prompt_lower):
            # Dividir por el separador
            partes = re.split(separador, prompt, flags=re.IGNORECASE)
            # Limpiar y retornar
            return [parte.strip() for parte in partes if parte.strip()]
    
    # IMPORTANTE: Verificar primero si es un rango de meses (NO separar)
    # "octubre y noviembre" = 1 reporte con rango de fechas
    meses_validos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    patron_rango_meses = r'(\w+)\s+y\s+(\w+)'
    match_meses = re.search(patron_rango_meses, prompt_lower)
    if match_meses:
        palabra1 = match_meses.group(1)
        palabra2 = match_meses.group(2)
        # Si ambas palabras son meses, NO separar (es un rango de fechas)
        if palabra1 in meses_validos and palabra2 in meses_validos:
            return [prompt]
    
    # Buscar patrón: "tabla ... y (otra) tabla ..."
    # Indica explícitamente dos tablas/reportes separados
    patron_tablas = r'(?:tabla|reporte)\s+.*?\s+y\s+(?:otra\s+)?(?:tabla|reporte)'
    if re.search(patron_tablas, prompt_lower):
        # Dividir por " y otra tabla" o " y tabla"
        partes = re.split(r'\s+y\s+(?:otra\s+)?tabla', prompt, flags=re.IGNORECASE)
        if len(partes) > 1:
            reportes = []
            for i, parte in enumerate(partes):
                parte = parte.strip()
                # Remover "tabla" del inicio si existe
                parte = re.sub(r'^tabla\s+', '', parte, flags=re.IGNORECASE)
                if parte:
                    # Agregar contexto si es necesario
                    if i > 0 and not any(palabra in parte.lower() for palabra in ['reporte', 'mostrar', 'ventas', 'productos', 'quiero', 'ver']):
                        parte = f"mostrar {parte}"
                    reportes.append(parte)
            if len(reportes) > 1:
                return reportes
    
    # Buscar patrón: "X por Y y Z más vendidos/top/mejores"
    # Esto indica dos análisis diferentes: uno agrupado y otro de ranking
    patron_doble = r'(?:ventas?|reportes?)\s+.*?\s+por\s+\w+\s+y\s+(?:productos?|clientes?|categorías?)\s+(?:más\s+vendidos?|top|mejores?|principales?)'
    if re.search(patron_doble, prompt_lower):
        # Intentar dividir en dos partes
        match = re.search(r'(.*?)\s+y\s+((?:productos?|clientes?|categorías?)\s+(?:más\s+vendidos?|top|mejores?|principales?).*)', prompt, flags=re.IGNORECASE)
        if match:
            parte1 = match.group(1).strip()
            parte2 = match.group(2).strip()
            # Agregar contexto a la segunda parte si es necesario
            if not any(palabra in parte2.lower() for palabra in ['reporte', 'mostrar', 'ventas', 'quiero', 'ver']):
                parte2 = f"mostrar {parte2}"
            return [parte1, parte2]
    
    # Si menciona explícitamente múltiples reportes/tablas
    if re.search(r'\d+\s+(?:reportes?|tablas?)', prompt_lower) or 'reportes' in prompt_lower or 'tablas' in prompt_lower:
        # Dividir por " y " solo si hay contextos diferentes
        partes_y = re.split(r'\s+y\s+', prompt, flags=re.IGNORECASE)
        if len(partes_y) > 1:
            # Verificar que sean comandos diferentes (tienen palabras clave de reporte)
            comandos_validos = []
            for parte in partes_y:
                parte_lower = parte.lower()
                if any(palabra in parte_lower for palabra in ['reporte', 'mostrar', 'ventas', 'productos', 'clientes', 'quiero', 'ver']):
                    comandos_validos.append(parte.strip())
            
            if len(comandos_validos) > 1:
                return comandos_validos
    
    # Si no detectó múltiples reportes, retornar el prompt original
    return [prompt]


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
        
        # Patrón 1a: "mes de [mes1] y [mes2]" o "octubre y noviembre" (rango de meses)
        patron_rango_meses = r'(?:mes de |de )?(\w+)\s+y\s+(\w+)'
        match_rango = re.search(patron_rango_meses, prompt)
        if match_rango:
            mes1_str = match_rango.group(1).lower()
            mes2_str = match_rango.group(2).lower()
            
            # Verificar si ambos son meses válidos
            if mes1_str in self.MESES and mes2_str in self.MESES:
                year = datetime.now().year
                mes1_num = self.MESES[mes1_str]
                mes2_num = self.MESES[mes2_str]
                
                # Inicio del primer mes
                fecha_inicio = datetime(year, mes1_num, 1)
                
                # Fin del segundo mes
                if mes2_num == 12:
                    fecha_fin = datetime(year + 1, 1, 1)
                else:
                    fecha_fin = datetime(year, mes2_num + 1, 1)
                
                return fecha_inicio, fecha_fin
        
        # Patrón 1b: "mes de [mes]" (un solo mes)
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

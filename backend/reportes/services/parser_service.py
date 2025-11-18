"""
ParserService: Servicio de análisis de lenguaje natural en español.
Extrae parámetros de reportes desde comandos de voz o texto.
"""
import re
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Dict, Any, Optional


class ParserService:
    """
    Servicio para parsear comandos en español y extraer parámetros de reportes.
    Soporta fechas relativas, rangos específicos, agrupaciones y formatos.
    """
    
    # Diccionarios de sinónimos para NLP básico
    MESES = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
        # Formas cortas
        'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12,
    }
    
    AGRUPACIONES = {
        'producto': ['producto', 'productos', 'artículo', 'artículos', 'item', 'items'],
        'cliente': ['cliente', 'clientes', 'usuario', 'usuarios', 'comprador', 'compradores'],
        'categoria': ['categoría', 'categorias', 'tipo', 'tipos', 'clase', 'clases'],
        'fecha': ['fecha', 'fechas', 'día', 'días', 'diario', 'diaria'],
    }
    
    FORMATOS = {
        'pdf': ['pdf', 'documento', 'imprimible', 'reporte'],
        'excel': ['excel', 'xls', 'xlsx', 'planilla', 'hoja de cálculo', 'spreadsheet'],
        'json': ['json', 'datos', 'api', 'raw'],
    }
    
    TIPOS_REPORTE = {
        'ventas': ['venta', 'ventas', 'vendido', 'vendidos', 'vendidas'],
        'productos': ['producto', 'productos', 'inventario', 'stock', 'existencias'],
        'clientes': ['cliente', 'clientes', 'comprador', 'compradores', 'usuario', 'usuarios'],
        'ingresos': ['ingreso', 'ingresos', 'ganancia', 'ganancias', 'revenue'],
    }

    def __init__(self):
        """Inicializa el parser con la fecha actual"""
        self.hoy = datetime.now().date()

    def extraer_periodo(self, prompt: str) -> Dict[str, Any]:
        """
        Extrae el período de tiempo del prompt.
        
        Soporta:
        - "del mes de [nombre_mes]"
        - "última semana"
        - "últimos [N] días"
        - "del [DD] de [mes] al [DD] de [mes]"
        - "hoy"
        - "esta semana"
        - "este mes"
        
        Returns:
            dict: {'inicio': date, 'fin': date, 'descripcion': str}
        """
        prompt_lower = prompt.lower()
        
        # Patrón: "del mes de [nombre_mes]"
        match = re.search(r'del mes de (\w+)', prompt_lower)
        if match:
            mes_nombre = match.group(1)
            if mes_nombre in self.MESES:
                mes_num = self.MESES[mes_nombre]
                anio = self.hoy.year
                
                # Ajustar año si el mes es futuro
                if mes_num > self.hoy.month:
                    anio -= 1
                
                inicio = datetime(anio, mes_num, 1).date()
                # Último día del mes
                if mes_num == 12:
                    fin = datetime(anio, 12, 31).date()
                else:
                    fin = (datetime(anio, mes_num + 1, 1) - timedelta(days=1)).date()
                
                return {
                    'inicio': inicio,
                    'fin': fin,
                    'descripcion': f'Mes de {mes_nombre.capitalize()} {anio}'
                }
        
        # Patrón: "última semana" o "última semana"
        if re.search(r'última\s+semana|ultimo\s+semana', prompt_lower):
            inicio = self.hoy - timedelta(days=7)
            return {
                'inicio': inicio,
                'fin': self.hoy,
                'descripcion': 'Última semana'
            }
        
        # Patrón: "últimos [N] días"
        match = re.search(r'últimos?\s+(\d+)\s+días?', prompt_lower)
        if match:
            dias = int(match.group(1))
            inicio = self.hoy - timedelta(days=dias)
            return {
                'inicio': inicio,
                'fin': self.hoy,
                'descripcion': f'Últimos {dias} días'
            }
        
        # Patrón: "este mes" o "mes actual"
        if re.search(r'este\s+mes|mes\s+actual', prompt_lower):
            inicio = datetime(self.hoy.year, self.hoy.month, 1).date()
            return {
                'inicio': inicio,
                'fin': self.hoy,
                'descripcion': f'Este mes ({self.hoy.strftime("%B %Y")})'
            }
        
        # Patrón: "esta semana"
        if re.search(r'esta\s+semana|semana\s+actual', prompt_lower):
            # Lunes de esta semana
            dias_desde_lunes = self.hoy.weekday()
            inicio = self.hoy - timedelta(days=dias_desde_lunes)
            return {
                'inicio': inicio,
                'fin': self.hoy,
                'descripcion': 'Esta semana'
            }
        
        # Patrón: "del [DD] de [mes] al [DD] de [mes]"
        match = re.search(
            r'del\s+(\d+)\s+de\s+(\w+)\s+al\s+(\d+)\s+de\s+(\w+)',
            prompt_lower
        )
        if match:
            dia_inicio = int(match.group(1))
            mes_inicio_nombre = match.group(2)
            dia_fin = int(match.group(3))
            mes_fin_nombre = match.group(4)
            
            if mes_inicio_nombre in self.MESES and mes_fin_nombre in self.MESES:
                mes_inicio = self.MESES[mes_inicio_nombre]
                mes_fin = self.MESES[mes_fin_nombre]
                anio = self.hoy.year
                
                # Ajustar año si es necesario
                if mes_inicio > self.hoy.month:
                    anio -= 1
                
                inicio = datetime(anio, mes_inicio, dia_inicio).date()
                fin = datetime(anio, mes_fin, dia_fin).date()
                
                return {
                    'inicio': inicio,
                    'fin': fin,
                    'descripcion': f'Del {dia_inicio} de {mes_inicio_nombre} al {dia_fin} de {mes_fin_nombre}'
                }
        
        # Patrón: "hoy"
        if re.search(r'\bhoy\b', prompt_lower):
            return {
                'inicio': self.hoy,
                'fin': self.hoy,
                'descripcion': 'Hoy'
            }
        
        # Patrón: "último mes"
        if re.search(r'último\s+mes|ultimo\s+mes', prompt_lower):
            # Primer día del mes pasado
            primer_dia_este_mes = datetime(self.hoy.year, self.hoy.month, 1).date()
            inicio = (primer_dia_este_mes - relativedelta(months=1))
            # Último día del mes pasado
            fin = primer_dia_este_mes - timedelta(days=1)
            
            return {
                'inicio': inicio,
                'fin': fin,
                'descripcion': f'Último mes ({inicio.strftime("%B %Y")})'
            }
        
        # Por defecto: último mes
        primer_dia_este_mes = datetime(self.hoy.year, self.hoy.month, 1).date()
        inicio = primer_dia_este_mes - relativedelta(months=1)
        fin = primer_dia_este_mes - timedelta(days=1)
        
        return {
            'inicio': inicio,
            'fin': fin,
            'descripcion': 'Último mes (por defecto)'
        }

    def extraer_agrupacion(self, prompt: str) -> str:
        """
        Extrae la agrupación deseada del prompt.
        
        Returns:
            str: 'producto' | 'cliente' | 'categoria' | 'fecha' | 'ninguno'
        """
        prompt_lower = prompt.lower()
        
        # Buscar palabras clave de agrupación
        for agrupacion, sinonimos in self.AGRUPACIONES.items():
            for sinonimo in sinonimos:
                if re.search(rf'\b(por|agrupado|agrupados|agrupadas|por)\s+{sinonimo}\b', prompt_lower):
                    return agrupacion
                if re.search(rf'\b{sinonimo}\b', prompt_lower) and 'por' in prompt_lower:
                    return agrupacion
        
        return 'ninguno'

    def extraer_formato(self, prompt: str) -> str:
        """
        Extrae el formato de salida deseado.
        
        Returns:
            str: 'pdf' | 'excel' | 'json'
        """
        prompt_lower = prompt.lower()
        
        # Buscar palabras clave de formato
        for formato, sinonimos in self.FORMATOS.items():
            for sinonimo in sinonimos:
                if re.search(rf'\b{sinonimo}\b', prompt_lower):
                    return formato
        
        # Por defecto: PDF
        return 'pdf'

    def extraer_tipo_reporte(self, prompt: str) -> str:
        """
        Extrae el tipo de reporte deseado.
        
        Returns:
            str: 'ventas' | 'productos' | 'clientes' | 'ingresos'
        """
        prompt_lower = prompt.lower()
        
        # Buscar palabras clave de tipo de reporte
        for tipo, sinonimos in self.TIPOS_REPORTE.items():
            for sinonimo in sinonimos:
                if re.search(rf'\b{sinonimo}\b', prompt_lower):
                    return tipo
        
        # Por defecto: ventas
        return 'ventas'

    def extraer_filtros_adicionales(self, prompt: str) -> Dict[str, Any]:
        """
        Extrae filtros adicionales como top N, ordenamiento, etc.
        
        Returns:
            dict: {'limit': int, 'orden': str}
        """
        prompt_lower = prompt.lower()
        filtros = {}
        
        # Patrón: "top [N]" o "primeros [N]"
        match = re.search(r'top\s+(\d+)', prompt_lower)
        if not match:
            match = re.search(r'primeros?\s+(\d+)', prompt_lower)
        
        if match:
            filtros['limit'] = int(match.group(1))
        
        # Ordenamiento por ventas/ingresos
        if re.search(r'más\s+vend[oi]d[oa]s?', prompt_lower):
            filtros['orden'] = '-cantidad'
        elif re.search(r'mayores?\s+ingres[oa]s?', prompt_lower):
            filtros['orden'] = '-total'
        elif re.search(r'menos\s+vend[oi]d[oa]s?', prompt_lower):
            filtros['orden'] = 'cantidad'
        
        return filtros

    def parsear(self, prompt: str) -> Dict[str, Any]:
        """
        Método principal que parsea el prompt completo.
        
        Args:
            prompt: Comando en español del usuario
            
        Returns:
            dict: Diccionario con todos los parámetros extraídos
        """
        resultado = {
            'tipo': self.extraer_tipo_reporte(prompt),
            'periodo': self.extraer_periodo(prompt),
            'agrupacion': self.extraer_agrupacion(prompt),
            'formato': self.extraer_formato(prompt),
            'filtros': self.extraer_filtros_adicionales(prompt),
            'prompt_original': prompt,
        }
        
        return resultado

"""
Procesador de archivos CSV/Excel para estados financieros
"""
import pandas as pd
from decimal import Decimal
from typing import Dict, Optional
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class ProcesadorEstadosFinancieros:
    """Procesa archivos CSV/Excel y extrae datos de estados financieros"""

    @staticmethod
    def procesar_archivo(archivo) -> Dict[str, any]:
        """
        Procesa un archivo CSV o Excel y extrae datos de estados financieros
        
        Formato esperado:
        - Primera hoja/columna: Balance General
        - Segunda hoja/columna: Estado de Resultados
        - Tercera hoja/columna (opcional): Flujo de Efectivo
        """
        try:
            # Detectar tipo de archivo
            nombre_archivo = archivo.name.lower()
            
            if nombre_archivo.endswith('.csv'):
                df = pd.read_csv(archivo)
                return ProcesadorEstadosFinancieros._procesar_dataframe(df)
            elif nombre_archivo.endswith(('.xlsx', '.xls')):
                # Leer todas las hojas
                excel_file = pd.ExcelFile(archivo)
                hojas = excel_file.sheet_names
                
                datos = {}
                
                # Buscar hoja de Balance General
                balance_df = None
                for hoja in hojas:
                    if 'balance' in hoja.lower() or 'bg' in hoja.lower():
                        balance_df = pd.read_excel(excel_file, sheet_name=hoja)
                        break
                
                if balance_df is None and len(hojas) > 0:
                    balance_df = pd.read_excel(excel_file, sheet_name=hojas[0])
                
                # Buscar hoja de Estado de Resultados
                estado_df = None
                for hoja in hojas:
                    if 'resultado' in hoja.lower() or 'pyg' in hoja.lower() or 'er' in hoja.lower():
                        estado_df = pd.read_excel(excel_file, sheet_name=hoja)
                        break
                
                if estado_df is None and len(hojas) > 1:
                    estado_df = pd.read_excel(excel_file, sheet_name=hojas[1])
                
                # Buscar hoja de Flujo de Efectivo (opcional)
                flujo_df = None
                for hoja in hojas:
                    if 'flujo' in hoja.lower() or 'efectivo' in hoja.lower() or 'fe' in hoja.lower():
                        flujo_df = pd.read_excel(excel_file, sheet_name=hoja)
                        break
                
                datos['balance'] = ProcesadorEstadosFinancieros._procesar_balance(balance_df) if balance_df is not None else {}
                datos['estado'] = ProcesadorEstadosFinancieros._procesar_estado(estado_df) if estado_df is not None else {}
                datos['flujo'] = ProcesadorEstadosFinancieros._procesar_flujo(flujo_df) if flujo_df is not None else {}
                
                return datos
            else:
                raise ValueError("Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)")
        
        except Exception as e:
            logger.error(f"Error procesando archivo: {str(e)}")
            raise ValueError(f"Error al procesar archivo: {str(e)}")

    @staticmethod
    def _procesar_dataframe(df: pd.DataFrame) -> Dict[str, any]:
        """Procesa un DataFrame único (CSV)"""
        datos = {}
        
        # Intentar detectar secciones
        # Asumimos que el CSV tiene columnas: Concepto, Valor
        if len(df.columns) >= 2:
            concepto_col = df.columns[0]
            valor_col = df.columns[1]
            
            # Buscar sección de Balance
            balance_data = {}
            estado_data = {}
            flujo_data = {}
            
            seccion_actual = None
            
            for idx, row in df.iterrows():
                concepto = str(row[concepto_col]).strip().lower()
                valor = row[valor_col]
                
                # Detectar cambio de sección
                if 'balance' in concepto or 'activo' in concepto and 'total' in concepto:
                    seccion_actual = 'balance'
                elif 'estado' in concepto or 'resultado' in concepto or 'ventas' in concepto:
                    seccion_actual = 'estado'
                elif 'flujo' in concepto or 'efectivo' in concepto:
                    seccion_actual = 'flujo'
                
                # Mapear conceptos a campos del modelo
                if seccion_actual == 'balance':
                    balance_data.update(ProcesadorEstadosFinancieros._mapear_concepto_balance(concepto, valor))
                elif seccion_actual == 'estado':
                    estado_data.update(ProcesadorEstadosFinancieros._mapear_concepto_estado(concepto, valor))
                elif seccion_actual == 'flujo':
                    flujo_data.update(ProcesadorEstadosFinancieros._mapear_concepto_flujo(concepto, valor))
            
            datos['balance'] = balance_data
            datos['estado'] = estado_data
            datos['flujo'] = flujo_data
        
        return datos

    @staticmethod
    def _procesar_balance(df: pd.DataFrame) -> Dict[str, Decimal]:
        """Procesa DataFrame de Balance General"""
        datos = {}
        
        # Buscar columna de valores (puede ser numérica)
        valor_col = None
        concepto_col = None
        
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64'] or 'valor' in col.lower() or 'monto' in col.lower():
                valor_col = col
            elif 'concepto' in col.lower() or 'cuenta' in col.lower() or 'rubro' in col.lower():
                concepto_col = col
        
        if concepto_col is None:
            concepto_col = df.columns[0]
        if valor_col is None:
            # Buscar primera columna numérica
            for col in df.columns:
                if df[col].dtype in ['float64', 'int64']:
                    valor_col = col
                    break
        
        if valor_col is None:
            return datos
        
        for idx, row in df.iterrows():
            concepto = str(row[concepto_col]).strip().lower()
            try:
                valor = Decimal(str(row[valor_col]).replace(',', '').replace('$', '').strip())
            except:
                continue
            
            datos.update(ProcesadorEstadosFinancieros._mapear_concepto_balance(concepto, valor))
        
        return datos

    @staticmethod
    def _procesar_estado(df: pd.DataFrame) -> Dict[str, Decimal]:
        """Procesa DataFrame de Estado de Resultados"""
        datos = {}
        
        valor_col = None
        concepto_col = None
        
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64'] or 'valor' in col.lower() or 'monto' in col.lower():
                valor_col = col
            elif 'concepto' in col.lower() or 'cuenta' in col.lower():
                concepto_col = col
        
        if concepto_col is None:
            concepto_col = df.columns[0]
        if valor_col is None:
            for col in df.columns:
                if df[col].dtype in ['float64', 'int64']:
                    valor_col = col
                    break
        
        if valor_col is None:
            return datos
        
        for idx, row in df.iterrows():
            concepto = str(row[concepto_col]).strip().lower()
            try:
                valor = Decimal(str(row[valor_col]).replace(',', '').replace('$', '').strip())
            except:
                continue
            
            datos.update(ProcesadorEstadosFinancieros._mapear_concepto_estado(concepto, valor))
        
        return datos

    @staticmethod
    def _procesar_flujo(df: pd.DataFrame) -> Dict[str, Decimal]:
        """Procesa DataFrame de Flujo de Efectivo"""
        datos = {}
        
        valor_col = None
        concepto_col = None
        
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64'] or 'valor' in col.lower():
                valor_col = col
            elif 'concepto' in col.lower():
                concepto_col = col
        
        if concepto_col is None:
            concepto_col = df.columns[0]
        if valor_col is None:
            for col in df.columns:
                if df[col].dtype in ['float64', 'int64']:
                    valor_col = col
                    break
        
        if valor_col is None:
            return datos
        
        for idx, row in df.iterrows():
            concepto = str(row[concepto_col]).strip().lower()
            try:
                valor = Decimal(str(row[valor_col]).replace(',', '').replace('$', '').strip())
            except:
                continue
            
            datos.update(ProcesadorEstadosFinancieros._mapear_concepto_flujo(concepto, valor))
        
        return datos

    @staticmethod
    def _mapear_concepto_balance(concepto: str, valor: Decimal) -> Dict[str, Decimal]:
        """Mapea conceptos de balance a campos del modelo"""
        mapeo = {}
        concepto_lower = concepto.lower()
        
        # Activo Corriente
        if 'caja' in concepto_lower or 'banco' in concepto_lower:
            mapeo['caja_bancos'] = valor
        elif 'cuenta' in concepto_lower and 'cobrar' in concepto_lower or 'cxc' in concepto_lower:
            mapeo['cuentas_por_cobrar'] = valor
        elif 'inventario' in concepto_lower or 'stock' in concepto_lower:
            mapeo['inventarios'] = valor
        elif 'activo' in concepto_lower and 'corriente' in concepto_lower and 'otro' in concepto_lower:
            mapeo['otros_activos_corrientes'] = valor
        
        # Activo No Corriente
        elif 'propiedad' in concepto_lower or 'planta' in concepto_lower or 'equipo' in concepto_lower or 'ppe' in concepto_lower:
            mapeo['propiedades_planta_equipo'] = valor
        elif 'inversión' in concepto_lower and 'largo' in concepto_lower:
            mapeo['inversiones_largo_plazo'] = valor
        elif 'intangible' in concepto_lower:
            mapeo['intangibles'] = valor
        elif 'activo' in concepto_lower and 'no corriente' in concepto_lower:
            mapeo['otros_activos_no_corrientes'] = valor
        
        # Pasivo Corriente
        elif 'cuenta' in concepto_lower and 'pagar' in concepto_lower or 'cxp' in concepto_lower:
            mapeo['cuentas_por_pagar'] = valor
        elif 'préstamo' in concepto_lower and 'corto' in concepto_lower:
            mapeo['prestamos_corto_plazo'] = valor
        elif 'pasivo' in concepto_lower and 'acreedor' in concepto_lower:
            mapeo['pasivos_acreedores'] = valor
        elif 'pasivo' in concepto_lower and 'corriente' in concepto_lower:
            mapeo['otros_pasivos_corrientes'] = valor
        
        # Pasivo No Corriente
        elif 'préstamo' in concepto_lower and 'largo' in concepto_lower:
            mapeo['prestamos_largo_plazo'] = valor
        elif 'pasivo' in concepto_lower and 'no corriente' in concepto_lower:
            mapeo['otros_pasivos_no_corrientes'] = valor
        
        # Patrimonio
        elif 'capital' in concepto_lower and 'social' in concepto_lower:
            mapeo['capital_social'] = valor
        elif 'reserva' in concepto_lower:
            mapeo['reservas'] = valor
        elif 'utilidad' in concepto_lower and 'acumulada' in concepto_lower:
            mapeo['utilidades_acumuladas'] = valor
        elif 'patrimonio' in concepto_lower:
            mapeo['otros_patrimonios'] = valor
        
        return mapeo

    @staticmethod
    def _mapear_concepto_estado(concepto: str, valor: Decimal) -> Dict[str, Decimal]:
        """Mapea conceptos de estado de resultados a campos del modelo"""
        mapeo = {}
        concepto_lower = concepto.lower()
        
        if 'venta' in concepto_lower and 'neta' in concepto_lower:
            mapeo['ventas_netas'] = valor
        elif 'ingreso' in concepto_lower and 'otro' in concepto_lower:
            mapeo['otros_ingresos'] = valor
        elif 'costo' in concepto_lower and 'venta' in concepto_lower or 'cogs' in concepto_lower:
            mapeo['costo_ventas'] = valor
        elif 'gasto' in concepto_lower and 'operativo' in concepto_lower:
            mapeo['gastos_operativos'] = valor
        elif 'gasto' in concepto_lower and 'financiero' in concepto_lower:
            mapeo['gastos_financieros'] = valor
        elif 'impuesto' in concepto_lower:
            mapeo['impuestos'] = valor
        
        return mapeo

    @staticmethod
    def _mapear_concepto_flujo(concepto: str, valor: Decimal) -> Dict[str, Decimal]:
        """Mapea conceptos de flujo de efectivo a campos del modelo"""
        mapeo = {}
        concepto_lower = concepto.lower()
        
        if 'utilidad' in concepto_lower and 'neta' in concepto_lower:
            mapeo['utilidad_neta'] = valor
        elif 'depreciación' in concepto_lower or 'amortización' in concepto_lower:
            mapeo['ajustes_depreciacion'] = valor
        elif 'capital' in concepto_lower and 'trabajo' in concepto_lower:
            mapeo['cambios_capital_trabajo'] = valor
        elif 'flujo' in concepto_lower and 'operativo' in concepto_lower:
            mapeo['flujo_operativo'] = valor
        elif 'compra' in concepto_lower and 'activo' in concepto_lower:
            mapeo['compras_activos_fijos'] = valor
        elif 'venta' in concepto_lower and 'activo' in concepto_lower:
            mapeo['ventas_activos_fijos'] = valor
        elif 'flujo' in concepto_lower and 'inversión' in concepto_lower:
            mapeo['flujo_inversion'] = valor
        elif 'préstamo' in concepto_lower and 'recibido' in concepto_lower:
            mapeo['prestamos_recibidos'] = valor
        elif 'pago' in concepto_lower and 'préstamo' in concepto_lower:
            mapeo['pago_prestamos'] = valor
        elif 'flujo' in concepto_lower and 'financiamiento' in concepto_lower:
            mapeo['flujo_financiamiento'] = valor
        
        return mapeo


import ccxt
import pandas as pd
import pandas_ta as ta
import time
import os
import sys
from datetime import datetime, timedelta
from backtesting import Backtest, Strategy

# ==============================================================================
# 1. GESTOR DE DATOS BLINDADO
# ==============================================================================
def get_market_data(file_name='btc_5m_1y.csv', symbol='BTC/USDT', timeframe='5m', days=365):
    """
    Intenta cargar localmente. Si falla, descarga con límite de seguridad.
    """
    
    # --- PASO 1: DIAGNÓSTICO DE ARCHIVO ---
    # Obtenemos la ruta absoluta donde está corriendo el script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, file_name)
    
    print(f"\n🔍 Buscando archivo en: {file_path}")
    
    if os.path.exists(file_path):
        print(f"✅ Archivo encontrado. Procesando...")
        try:
            df = pd.read_csv(file_path)
            
            # Normalizar nombres de columnas (Primera letra mayúscula)
            df.columns = [col.strip().capitalize() for col in df.columns]
            
            # Mapeo inteligente de columnas
            rename_map = {
                'Timestamp': 'Time', 'Date': 'Time', 'Datetime': 'Time',
                'Vol': 'Volume'
            }
            df.rename(columns=rename_map, inplace=True)
            
            # Buscar columna de tiempo válida
            if 'Time' in df.columns:
                df['Time'] = pd.to_datetime(df['Time'])
                df.set_index('Time', inplace=True)
                df = df[~df.index.duplicated(keep='first')]
                
                # Ordenar por fecha (vital para backtesting)
                df.sort_index(inplace=True)
                
                print(f"📦 Datos cargados: {len(df)} velas (Desde {df.index[0]} hasta {df.index[-1]})")
                return df
            else:
                print("❌ El CSV no tiene una columna de fecha reconocible (Timestamp, Date, Time).")
                print("⚠️ Columnas detectadas:", df.columns.tolist())
        except Exception as e:
            print(f"❌ Error leyendo el archivo: {e}")
    else:
        print("❌ Archivo NO encontrado en esa ruta.")

    # --- PASO 2: DESCARGA (SOLO SI FALLA LO ANTERIOR) ---
    print("\n🌐 Iniciando descarga de respaldo desde Binance...")
    return fetch_with_safety_limits(symbol, timeframe, days)

def fetch_with_safety_limits(symbol, timeframe, days):
    exchange = ccxt.binance({'enableRateLimit': True})
    
    # Fechas
    end_time = datetime.now()
    start_date = end_time - timedelta(days=days)
    since = int(start_date.timestamp() * 1000)
    end_timestamp = int(end_time.timestamp() * 1000)
    
    all_candles = []
    limit = 1000
    consecutive_errors = 0
    max_retries = 5  # <--- SEGURIDAD: Máximo 5 errores seguidos
    
    print(f"   ⏳ Descargando desde {start_date.date()} hasta hoy...")

    while True:
        try:
            candles = exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=limit)
            
            # Si Binance no da nada, terminamos
            if not candles:
                print("\n   ✅ Binance no envió más datos. Descarga terminada.")
                break
            
            # Reiniciamos contador de errores al tener éxito
            consecutive_errors = 0
            
            last_candle_time = candles[-1][0]
            
            # Evitar bucle de datos repetidos
            if all_candles and last_candle_time == all_candles[-1][0]:
                print("\n   ⚠️ Datos duplicados detectados. Terminando.")
                break
                
            all_candles.extend(candles)
            since = last_candle_time + 1
            
            # Feedback de progreso
            progress = min(100, int((last_candle_time - (start_date.timestamp()*1000)) / (end_timestamp - (start_date.timestamp()*1000)) * 100))
            sys.stdout.write(f"\r   🚀 Progreso: {progress}% | Velas: {len(all_candles)}")
            sys.stdout.flush()
            
            # Si llegamos al presente
            if last_candle_time >= end_timestamp:
                print("\n   ✅ Se alcanzó la fecha actual.")
                break
                
        except KeyboardInterrupt:
            print("\n🛑 Cancelado por el usuario.")
            sys.exit()
        except Exception as e:
            consecutive_errors += 1
            print(f"\n   ⚠️ Error ({consecutive_errors}/{max_retries}): {e}")
            time.sleep(2)
            
            if consecutive_errors >= max_retries:
                print("\n❌ Demasiados errores de conexión. Abortando descarga.")
                raise Exception("Fallo crítico de red.")

    if not all_candles:
        raise ValueError("No se pudieron descargar datos.")

    df = pd.DataFrame(all_candles, columns=['Time', 'Open', 'High', 'Low', 'Close', 'Volume'])
    df['Time'] = pd.to_datetime(df['Time'], unit='ms')
    df.set_index('Time', inplace=True)
    df = df[~df.index.duplicated(keep='first')]
    return df

# ==============================================================================
# 2. ESTRATEGIA
# ==============================================================================
class SmartGridBot(Strategy):
    grid_step_pct = 1.0       
    take_profit_pct = 1.5     
    max_positions = 5         
    rsi_crash_threshold = 30  
    pump_threshold = 0.04     

    def init(self):
        self.rsi = self.I(ta.rsi, pd.Series(self.data.Close), length=14)
        self.ema = self.I(ta.ema, pd.Series(self.data.Close), length=50)
        self.last_entry_price = 0

    def next(self):
        price = self.data.Close[-1]
        
        # Filtros (Manejo seguro de NaN)
        rsi_val = self.rsi[-1] if not pd.isna(self.rsi[-1]) else 50
        ema_val = self.ema[-1] if not pd.isna(self.ema[-1]) else price
        
        is_crashing = rsi_val < self.rsi_crash_threshold
        deviation = (price - ema_val) / ema_val
        is_pumping = deviation > self.pump_threshold

        # Take Profit
        if self.position:
            if self.position.pl_pct > (self.take_profit_pct / 100):
                self.position.close()
                self.last_entry_price = 0
                return

        # Grid Logic
        if not is_crashing and not is_pumping:
            if not self.position:
                self.buy()
                self.last_entry_price = price
            elif len(self.trades) < self.max_positions:
                # Evitar error si last_entry_price es 0
                ref_price = self.last_entry_price if self.last_entry_price > 0 else price
                next_buy_level = ref_price * (1 - self.grid_step_pct/100)
                
                if price < next_buy_level:
                    self.buy()
                    self.last_entry_price = price

# ==============================================================================
# 3. EJECUCIÓN
# ==============================================================================
if __name__ == '__main__':
    try:
        # Busca el archivo 'btc_5m_1y.csv'. Si falla, baja datos.
        data = get_market_data(file_name='btc_5m_1y.csv')
        
        print("\n⚙️  Iniciando Backtest...")
        bt = Backtest(data, SmartGridBot, cash=10000, commission=.001)

        print("🧬 Ejecutando Optimización Genética (Paciencia)...")
        stats, heatmap = bt.optimize(
            grid_step_pct = [0.5, 1.0, 2.0],      
            take_profit_pct = [1.0, 2.0, 3.0],    
            rsi_crash_threshold = [20, 30, 0],    
            max_positions = [5, 10],            
            
            maximize='Sharpe Ratio',
            constraint=lambda p: p.take_profit_pct >= p.grid_step_pct,
            return_heatmap=True
        )

        print("\n🏆 RESULTADOS:")
        print(stats)
        print("\n⭐ CONFIGURACIÓN GANADORA:")
        print(stats._strategy)
        
        bt.plot()
        
    except Exception as e:
        print(f"\n❌ ERROR FATAL: {e}")
        input("Presiona ENTER para salir...") # Pausa para leer el error
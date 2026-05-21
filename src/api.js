import axios from 'axios'

// Simulamos ser una persona usando Google Chrome en Windows para saltar filtros básicos
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

export const obtenerCotizacionesMasivas = async (tickersOriginales) => {
  const resultados = [];
  
  // Hacemos las peticiones una por una para no saturar, pero el endpoint crudo responde en milisegundos
  for (const tickerOriginal of tickersOriginales) {
    const tickerBA = tickerOriginal.endsWith('.BA') ? tickerOriginal : `${tickerOriginal}.BA`;
    
    try {
      // El secreto: Le pegamos al endpoint /v8/finance/chart que NO pide crumb/cookies
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${tickerBA}?interval=1d&range=1d`;
      const response = await axios.get(url, { headers });
      
      const meta = response.data.chart.result[0].meta;
      const precioActual = meta.regularMarketPrice;
      const cierreAnterior = meta.chartPreviousClose;
      
      // Calculamos la variación nosotros mismos con matemática básica
      const variacion = ((precioActual - cierreAnterior) / cierreAnterior) * 100;

      resultados.push({
        symbol: tickerBA,
        regularMarketPrice: precioActual,
        regularMarketChangePercent: variacion,
        currency: meta.currency || 'ARS'
      });
    } catch (error) {
      console.error(`💥 Bloqueo o error en ${tickerBA}:`, error.message);
    }
  }
  return resultados;
};

// Reutilizamos la masiva para buscar uno solo (comando /precio)
export const obtenerCotizacion = async (tickerOriginal) => {
  const res = await obtenerCotizacionesMasivas([tickerOriginal]);
  return res.length > 0 ? res[0] : null;
};

// --- RADAR DE CEDEARS ---
const radarTickers = [
  'AAPL.BA', 'MSFT.BA', 'NVDA.BA', 'TSLA.BA', 'AMZN.BA', 
  'MELI.BA', 'KO.BA', 'V.BA', 'WMT.BA', 'META.BA', 
  'GOOGL.BA', 'AMD.BA', 'DIS.BA', 'PYPL.BA', 'INTC.BA'
];

export const obtenerTopMovimientos = async () => {
  try {
    const quotes = await obtenerCotizacionesMasivas(radarTickers);
    const mapeados = quotes.map(q => ({
      ticker: q.symbol.replace('.BA', ''),
      precio: q.regularMarketPrice,
      variacion: q.regularMarketChangePercent
    }));
    
    // Ordenamos de mayor a menor (Top Ganadores)
    mapeados.sort((a, b) => b.variacion - a.variacion);
    return mapeados.slice(0, 10);
  } catch (error) {
    return [];
  }
};

export const obtenerBottomMovimientos = async () => {
  try {
    const quotes = await obtenerCotizacionesMasivas(radarTickers);
    const mapeados = quotes.map(q => ({
      ticker: q.symbol.replace('.BA', ''),
      precio: q.regularMarketPrice,
      variacion: q.regularMarketChangePercent
    }));
    
    // Ordenamos de menor a mayor (Top Perdedores)
    mapeados.sort((a, b) => a.variacion - b.variacion);
    return mapeados.slice(0, 10);
  } catch (error) {
    return [];
  }
};

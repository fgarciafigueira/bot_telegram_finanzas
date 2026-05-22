import axios from 'axios'

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

// 1. Buscamos el Dólar CCL
export const obtenerCCL = async () => {
  try {
    const res = await axios.get('https://dolarapi.com/v1/dolares/contadoconliqui')
    return res.data.venta;
  } catch (error) {
    return null
  }
};

// 2. Buscamos el precio puro en Wall Street (Sin el .BA)
export const obtenerCotizacionUSA = async (ticker) => {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    return response.data.chart.result[0].meta.regularMarketPrice;
  } catch (error) {
    return null;
  }
}

// 3. Diccionario de Ratios de los CEDEARs más populares
export const ratiosCedears = {
  // Tecnológicas y Gigantes
  'AAPL': 20, 'MSFT': 30, 'NVDA': 24, 'TSLA': 15, 'AMZN': 144, 'GOOGL': 58, 'META': 24,
  'AMD': 10, 'INTC': 5, 'QCOM': 11, 'CRM': 18, 'ADBE': 44, 'NFLX': 48, 'CSCO': 5, 'PLTR': 3,
  
  // E-commerce y Fintech
  'MELI': 120, 'V': 18, 'MA': 33, 'PYPL': 8, 'BABA': 9, 'SQ': 12,
  
  // Consumo Masivo y Retail
  'KO': 5, 'PEP': 18, 'WMT': 18, 'MCD': 24, 'PG': 15, 'COST': 48, 'NKE': 12, 'SBUX': 12, 'HD': 32,
  
  // Bancos y Financieras
  'JPM': 15, 'BAC': 4, 'C': 3, 'WFC': 5, 'GS': 13,
  
  // Salud y Farmacéuticas
  'JNJ': 12, 'UNH': 33, 'PFE': 4, 'ABBV': 10, 'MRK': 5, 'LLY': 56,
  
  // Industriales, Energía y Otros
  'DIS': 12, 'BA': 18, 'XOM': 10, 'CVX': 16, 'CAT': 20, 'MMM': 10, 'GE': 20, 'F': 1, 'GM': 6,
  'T': 3, 'VZ': 4, 'PBR': 1, 'VALE': 2, 'UGP': 1, 'BBD': 1,
  
  // Índices (ETFs)
  'SPY': 20, 'QQQ': 20, 'DIA': 20, 'IWM': 10, 'EEM': 5
}


export const obtenerCotizacionesMasivas = async (tickersOriginales) => {
  const resultados = []
  const chunkSize = 10 // Procesamos de a 10 para no comer ban de Yahoo
  
  for (let i = 0; i < tickersOriginales.length; i += chunkSize) {
    const chunk = tickersOriginales.slice(i, i + chunkSize)
    
    const promesas = chunk.map(async (tickerOriginal) => {
      const tickerBA = tickerOriginal.endsWith('.BA') ? tickerOriginal : `${tickerOriginal}.BA`
      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${tickerBA}?interval=1d&range=1d`
        const response = await axios.get(url, { headers })
        
        const meta = response.data.chart.result[0].meta
        const precioActual = meta.regularMarketPrice
        const cierreAnterior = meta.chartPreviousClose
        const variacion = ((precioActual - cierreAnterior) / cierreAnterior) * 100

        return {
          symbol: tickerBA,
          regularMarketPrice: precioActual,
          regularMarketChangePercent: variacion,
          currency: meta.currency || 'ARS'
        };
      } catch (error) {
        // Si uno falla (ej. no existe), lo ignoramos silenciosamente
        return null
      }
    })

    const resultadosChunk = await Promise.all(promesas)
    resultados.push(...resultadosChunk.filter(r => r !== null))
  }
  
  return resultados
};

export const obtenerCotizacion = async (tickerOriginal) => {
  const res = await obtenerCotizacionesMasivas([tickerOriginal])
  return res.length > 0 ? res[0] : null
}

// --- RADAR DE CEDEARS (Los 60 más operados de BYMA) ---
const radarTickers = [
  // Tecnológicas y Gigantes
  'AAPL.BA', 'MSFT.BA', 'NVDA.BA', 'TSLA.BA', 'AMZN.BA', 'GOOGL.BA', 'META.BA',
  'AMD.BA', 'INTC.BA', 'QCOM.BA', 'CRM.BA', 'ADBE.BA', 'NFLX.BA', 'CSCO.BA', 'PLTR.BA',
  // E-commerce y Fintech
  'MELI.BA', 'V.BA', 'MA.BA', 'PYPL.BA', 'BABA.BA', 'SQ.BA',
  // Consumo Masivo y Retail
  'KO.BA', 'PEP.BA', 'WMT.BA', 'MCD.BA', 'PG.BA', 'COST.BA', 'NKE.BA', 'SBUX.BA', 'HD.BA',
  // Bancos y Financieras
  'JPM.BA', 'BAC.BA', 'C.BA', 'WFC.BA', 'GS.BA',
  // Salud y Farmacéuticas
  'JNJ.BA', 'UNH.BA', 'PFE.BA', 'ABBV.BA', 'MRK.BA', 'LLY.BA',
  // Industriales, Energía y Otros
  'DIS.BA', 'BA.BA', 'XOM.BA', 'CVX.BA', 'CAT.BA', 'MMM.BA', 'GE.BA', 'F.BA', 'GM.BA',
  'T.BA', 'VZ.BA', 'PBR.BA', 'VALE.BA', 'UGP.BA', 'BBD.BA',
  // Índices (ETFs)
  'SPY.BA', 'QQQ.BA', 'DIA.BA', 'IWM.BA', 'EEM.BA'
]

export const obtenerTopMovimientos = async () => {
  try {
    const quotes = await obtenerCotizacionesMasivas(radarTickers)
    const mapeados = quotes.map(q => ({
      ticker: q.symbol.replace('.BA', ''),
      precio: q.regularMarketPrice,
      variacion: q.regularMarketChangePercent
    }))
    
    mapeados.sort((a, b) => b.variacion - a.variacion)
    return mapeados.slice(0, 10)
  } catch (error) {
    return []
  }
}

export const obtenerBottomMovimientos = async () => {
  try {
    const quotes = await obtenerCotizacionesMasivas(radarTickers)
    const mapeados = quotes.map(q => ({
      ticker: q.symbol.replace('.BA', ''),
      precio: q.regularMarketPrice,
      variacion: q.regularMarketChangePercent
    }))
    
    mapeados.sort((a, b) => a.variacion - b.variacion)
    return mapeados.slice(0, 10)
  } catch (error) {
    return []
  }
}

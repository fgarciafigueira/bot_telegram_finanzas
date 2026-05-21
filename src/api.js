import axios from 'axios'
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import dotenv from 'dotenv'
dotenv.config()
const FINNHUB_KEY = process.env.FINNHUB_API_KEY

import puppeteer from 'puppeteer'

//traer los precios de los cedear en YAHOO
export const obtenerCotizacion = async (tickerOriginal) => {
  // Aseguramos el sufijo .BA en un solo lugar
  const ticker = tickerOriginal.endsWith('.BA') ? tickerOriginal : `${tickerOriginal}.BA`;
  return await yahooFinance.quote(ticker)
}

export const obtenerBottomMovimientos = async () =>{
   try {
   const morelosers = await yahooFinance.screener ({
        scrIds: "day_losers",
        count:10
   })
   const lista=morelosers.quotes.map((stock) => {return stock.symbol})
   
   console.log(morelosers.quotes[0])
   
   // Verificamos que la respuesta tenga el formato esperado
    if (!lista || !Array.isArray(lista)) {
      throw new Error("Respuesta inesperada de Yahoo Finance");
    }
    
    const tickers = lista.slice(0, 15)

    // 3. Convertimos a .BA y consultamos los precios actuales en pesos a Yahoo
    const promesas = tickers.map(async (ticker) => {
      try {
        const quote = await yahooFinance.quote(`${ticker}.BA`)
        return {
          ticker: ticker,
          precio: quote.regularMarketPrice,
          variacion: quote.regularMarketChangePercent || 0
        };
      } catch (e) {
        return null // Si no hay CEDEAR, ignoramos
      }
    })

    const resultados = await Promise.all(promesas);
    
    // 4. Filtramos los nulos y ordenamos por variación
    return resultados
      .filter(r => r !== null)
      .sort((a, b) => b.variacion - a.variacion)
      .slice(0, 10); // Nos quedamos con el top 10

  } catch (error) {
    console.error("Error en radar automático:", error)
    return []
  } 
}

export const obtenerTopMovimientos = async () => {
  try {
   const moreGainer = await yahooFinance.screener ({
        scrIds: "day_gainers",
        region: "AR",
        count:10
   })
   const lista=moreGainer.quotes.map((stock) => {return stock.symbol})

    // Verificamos que la respuesta tenga el formato esperado
    if (!lista || !Array.isArray(lista)) {
      throw new Error("Respuesta inesperada de Yahoo Finance");
    }
    console.log(lista)
    
    const tickers = lista.slice(0, 15)

    // 3. Convertimos a .BA y consultamos los precios actuales en pesos a Yahoo
    const promesas = tickers.map(async (ticker) => {
      try {
        const quote = await yahooFinance.quote(`${ticker}.BA`)
        return {
          ticker: ticker,
          precio: quote.regularMarketPrice,
          variacion: quote.regularMarketChangePercent || 0
        };
      } catch (e) {
        return null // Si no hay CEDEAR, ignoramos
      }
    })

    const resultados = await Promise.all(promesas);
    
    // 4. Filtramos los nulos y ordenamos por variación
    return resultados
      .filter(r => r !== null)
      .sort((a, b) => b.variacion - a.variacion)
      .slice(0, 10); // Nos quedamos con el top 10

  } catch (error) {
    console.error("Error en radar automático:", error)
    return []
  }
}

export const obtenerCotizacionesMasivas = async (tickersOriginales) => {
  try {
    // A todos les agregamos .BA
    const tickersBA = tickersOriginales.map(t => t.endsWith('.BA') ? t : `${t}.BA`);
    
    // Yahoo Finance permite pasarle un array directamente
    const quotes = await yahooFinance.quote(tickersBA);
    
    // Si mandamos un solo ticker, devuelve un objeto. Si mandamos varios, un array. 
    // Lo forzamos siempre a array para evitar errores.
    return Array.isArray(quotes) ? quotes : [quotes];
  } catch (error) {
    console.error("Error en consulta masiva:", error.message);
    return [];
  }
}

import { obtenerCotizacion, obtenerTopMovimientos, obtenerBottomMovimientos } from './api.js';
import { obtenerPortafolios, guardarPortafolios, obtenerTodosLosPortafolios } from './db.js';

// Pedido Precio Singular
export const handlePrecio = async (bot, msg, match) => {
  const chatId = msg.chat.id
  const ticker = match[1].toUpperCase().trim()

  try {
    bot.sendChatAction(chatId, 'typing')
    const quote = await obtenerCotizacion(ticker)

    if (!quote || !quote.regularMarketPrice) {
      return bot.sendMessage(chatId, `❌ No se encontraron datos para **${ticker}**.`)
    }

    const precio = quote.regularMarketPrice
    const variacion = quote.regularMarketChangePercent || 0
    const moneda = quote.currency || 'ARS'
    const indicador = variacion >= 0 ? '🟢' : '🔴'
    const signo = variacion >= 0 ? '+' : ''

    const msj = `📊 **${ticker}**\n💲 Precio: ${moneda} $${precio.toLocaleString('es-AR')}\n${indicador} Variación: ${signo}${variacion.toFixed(2)}%`
    
    bot.sendMessage(chatId, msj, { parse_mode: 'Markdown' })
  } catch (error) {
    
    bot.sendMessage(chatId, "⚠️ Hubo un problema al consultar el mercado.")
  }
};

//Pedido creacion Portafolio
export const handlePortafolio = async (bot, msg, match) => {
  const chatId = msg.chat.id
  const nuevosTickers = match[1].toUpperCase().split(',').map(t => t.trim()).filter(t => t !== '');

  await guardarPortafolios(chatId, nuevosTickers)
  
  bot.sendMessage(chatId, `✅ Portafolio actualizado:\n**${nuevosTickers.join(', ')}**`, { parse_mode: 'Markdown' })
}

//Agregar Ticker al Portafolio
export const handleAgregar = async(bot, msg, match) => {
  const chatId = msg.chat.id
  const ticker = match[1].toUpperCase().trim()
  const miPortafolio = await obtenerPortafolios(chatId)

  if (miPortafolio.includes(ticker)) {
    return bot.sendMessage(chatId, `⚠️ **${ticker}** ya está en tu portafolio.`, { parse_mode: 'Markdown' })
  }

  miPortafolio.push(ticker)
  await guardarPortafolios(chatId, miPortafolio)
  
  bot.sendMessage(chatId, `✅ **${ticker}** fue agregado a tu portafolio.`, { parse_mode: 'Markdown' })
}

//Quitar Ticker del Portafolio
export const handleQuitar = async (bot, msg, match) => {
  const chatId = msg.chat.id
  const ticker = match[1].toUpperCase().trim()
  let miPortafolio = await obtenerPortafolios(chatId)

  if (!miPortafolio.includes(ticker)) {
    return bot.sendMessage(chatId, `⚠️ **${ticker}** no se encontró en tu portafolio.`, { parse_mode: 'Markdown' })
  }

  miPortafolio = miPortafolio.filter(t => t !== ticker)
  await guardarPortafolios(chatId, miPortafolio)

  bot.sendMessage(chatId, `🗑️ **${ticker}** fue eliminado de tu portafolio.`, { parse_mode: 'Markdown' })
}

//Resumen del Portafolio
export const handleResumen = async (bot, msg) => {
  const chatId = msg.chat.id
  const miPortafolio = await obtenerPortafolios(chatId)

  if (miPortafolio.length === 0) {
    return bot.sendMessage(chatId, "🤷‍♂️ Tu portafolio está vacío. Usá el comando `/agregar [TICKER]` o `/portafolio [TICKER1, TICKER2...]` para sumar activos.", { parse_mode: 'Markdown' })
  }

  try {
    bot.sendChatAction(chatId, 'typing');
    let mensajeResumen = '📋 **Resumen de tu Portafolio**\n---\n'

    const promesas = miPortafolio.map(async (tickerOriginal) => {
      try {
        const quote = await obtenerCotizacion(tickerOriginal)
        return { ticker: tickerOriginal, quote }
      } catch (error) {
        console.error(`💥 Error trayendo ${tickerOriginal}:`, error.message)
        return { ticker: tickerOriginal, quote: null };
      }
    });

    const resultados = await Promise.all(promesas)

    resultados.forEach(resultado => {
      const { ticker, quote } = resultado
      
      if (!quote || !quote.regularMarketPrice) {
        mensajeResumen += `❌ **${ticker}**: Sin datos\n`
        return
      }

      const precio = quote.regularMarketPrice
      const variacion = quote.regularMarketChangePercent || 0
      const moneda = quote.currency || 'ARS'
      const indicador = variacion >= 0 ? '🟢' : '🔴'
      const signo = variacion >= 0 ? '+' : ''

      mensajeResumen += `${indicador} **${ticker}**: ${moneda} $${precio.toLocaleString('es-AR')} (${signo}${variacion.toFixed(2)}%)\n`
    })

    bot.sendMessage(chatId, mensajeResumen, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error("Error al armar el resumen:", error)
    bot.sendMessage(chatId, "⚠️ Hubo un problema al armar el resumen.")
  }
}


//Radar de movimientos
export const enviarAlertasDiarias = async (bot) => {
  const portafolios = await obtenerTodosLosPortafolios()
  const chatIds = Object.keys(portafolios) // Agarramos todos los IDs de usuarios guardados
  
  if (chatIds.length === 0) return // Si no hay nadie registrado, no hacemos nada

  // 1. Buscamos el Top 10 del día
  const top10 = await obtenerTopMovimientos()
  let textoTop10 = '\n🔥 **Top CEDEARs Ganadores del Día**\n---\n'
  
  top10.forEach(t => {
    const indicador = t.variacion >= 0 ? '🟢' : '🔴'
    const signo = t.variacion >= 0 ? '+' : ''
    textoTop10 += `${indicador} **${t.ticker}**: $${t.precio.toLocaleString('es-AR')} (${signo}${t.variacion.toFixed(2)}%)\n`;
  })

  const top10loosers= await obtenerBottomMovimientos()
  textoTop10 += '\n❌ **Top CEDEARs Perdedores del Día**\n---\n'

  top10loosers.forEach(t => {
    const indicador = t.variacion >= 0 ? '🟢' : '🔴'
    const signo = t.variacion >= 0 ? '+' : ''
    textoTop10 += `${indicador} **${t.ticker}**: $${t.precio.toLocaleString('es-AR')} (${signo}${t.variacion.toFixed(2)}%)\n`;
  })

  // 2. Le mandamos a cada usuario su resumen personal + el top 10
  for (const chatId of chatIds) {
    const miPortafolio = portafolios[chatId]
    if (!miPortafolio || miPortafolio.length === 0) continue

    let mensaje = '🔔 **Cierre de Mercado**\n📋 **Tu Portafolio**\n---\n'
    
    // Acá traemos los activos del usuario (importá obtenerCotizacion si no lo tenías)
    const promesas = miPortafolio.map(t => obtenerCotizacion(t))
    const resultados = await Promise.all(promesas)

    resultados.forEach((quote, index) => {
      const ticker = miPortafolio[index];
      if (!quote || !quote.regularMarketPrice) {
        mensaje += `❌ **${ticker}**: Sin datos\n`
        return
      }
      const variacion = quote.regularMarketChangePercent || 0
      const indicador = variacion >= 0 ? '🟢' : '🔴'
      const signo = variacion >= 0 ? '+' : ''
      mensaje += `${indicador} **${ticker}**: $${quote.regularMarketPrice.toLocaleString('es-AR')} (${signo}${variacion.toFixed(2)}%)\n`
    })

    // Pegamos el Top 10 abajo del portafolio personal
    mensaje += textoTop10

    bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' })
  }
}

export const handleTestCron = async (bot, msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "⏳ Probando el resumen de cierre de mercado...");
  await enviarAlertasDiarias(bot);
}
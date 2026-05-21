import dotenv from 'dotenv'
dotenv.config()
import TelegramBot from 'node-telegram-bot-api'
import {
    handlePrecio,
    handlePortafolio,
    handleAgregar,
    handleQuitar,
    handleResumen,
    enviarAlertasDiarias,
    handleTestCron
} from './src/handlers.js'

import cron from 'node-cron'
import express from 'express'

const token = process.env.TELEGRAM_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID
const bot = new TelegramBot(token, { polling: true })



if (!token || !chatId ) {
  console.error('Error: Faltan variables de entorno. Asegúrate de tener TELEGRAM_TOKEN, TELEGRAM_CHAT_ID en tu archivo .env')
  process.exit(1)
}

console.log ("Botty finanzas iniciado perfectamente")


bot.onText(/\/precio (.+)/, (msg, match) => handlePrecio(bot, msg, match))
bot.onText(/\/portafolio (.+)/, (msg, match) => handlePortafolio(bot, msg, match))
bot.onText(/\/agregar (.+)/, (msg, match) => handleAgregar(bot, msg, match))
bot.onText(/\/quitar (.+)/, (msg, match) => handleQuitar(bot, msg, match))
bot.onText(/\/resumen/, (msg) => handleResumen(bot, msg))
bot.onText(/\/testcron/, (msg) => handleTestCron(bot, msg))

cron.schedule('0 17 * * 1-5', () => {
  console.log("Ejecutando alerta de cierre de mercado...")
  enviarAlertasDiarias(bot)
}, {
  scheduled: true,
  timezone: "America/Argentina/Buenos_Aires"
})

bot.on('polling_error', (error) => {
  if (error.code === 'EFATAL') {
    // Es un microcorte normal, lo ignoramos silenciosamente
    return; 
  }
  console.error("Error de Telegram:", error.message)
})

const app = express();
// Ruta básica para que el servidor responda si entran desde el navegador
app.get('/', (req, res) => {
  res.send('El Bot Financiero está corriendo 🚀');
});

// Render nos va a dar un puerto dinámico en process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor web fantasma escuchando en el puerto ${PORT}`);
});
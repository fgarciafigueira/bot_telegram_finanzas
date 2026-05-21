# 📈 Bot Financiero de Telegram (CEDEARs & Acciones)

Un bot de Telegram desarrollado en Node.js para consultar cotizaciones en tiempo real y gestionar un portafolio de inversiones. Está optimizado para el mercado argentino, obteniendo automáticamente los precios de los **CEDEARs en Pesos Argentinos (ARS)** a través de la API de Yahoo Finance.

## ✨ Características

- **Consulta en tiempo real:** Obtiene el precio actual, apertura, cierre anterior y variación porcentual diaria.
- **Optimizado para BYMA:** Al consultar un ticker (ej. `AAPL`), el bot automáticamente busca su equivalente en CEDEAR (`AAPL.BA`) y devuelve el valor en ARS.
- **Gestión de Portafolio:** Permite agregar, quitar o sobreescribir una lista de activos favoritos de forma persistente.
- **Resumen consolidado:** Muestra el rendimiento de todos los activos del portafolio en un único mensaje.
- **Arquitectura Modular:** Código limpio y escalable, separado en rutas, controladores, base de datos y servicios de API.

## 🚀 Comandos Disponibles

- `/precio [TICKER]` - Muestra la cotización actual de un activo (Ej: `/precio MELI`).
- `/agregar [TICKER]` - Suma un activo a tu portafolio.
- `/quitar [TICKER]` - Elimina un activo de tu portafolio.
- `/portafolio [TICKER1, TICKER2...]` - Sobreescribe todo tu portafolio con una nueva lista separada por comas.
- `/resumen` - Muestra la cotización y variación diaria de todos los activos en tu portafolio.

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/fgarciafigueira/bot_telegram_finanzas.git](https://github.com/fgarciafigueira/bot_telegram_finanzas.git)
   cd bot_telegram_finanzas
2. **instalar dependencias:**
   npm install
3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y agrega tu token de Telegram:
   ```env
   TELEGRAM_TOKEN="TU_TOKEN_AQUI"
4. **Iniciar Bot**
node index.js
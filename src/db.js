import admin from 'firebase-admin'

// Inicializamos Firebase usando las variables de entorno
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Reemplazamos los saltos de línea literales por reales para que Node los lea bien
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();
const coleccion = db.collection('portafolios');

// Trae solo el portafolio de un usuario específico
export const obtenerPortafolios = async (chatId) => {
  const doc = await coleccion.doc(chatId.toString()).get();
  if (doc.exists) {
    return doc.data().tickers || [];
  }
  return []; // Si no existe, devolvemos array vacío
};

// Guarda o actualiza el portafolio de un usuario
export const guardarPortafolios = async (chatId, tickers) => {
  await coleccion.doc(chatId.toString()).set({ tickers });
};

// Trae todos los portafolios de la base (Lo necesitamos para el CRON diario)
export const obtenerTodosLosPortafolios = async () => {
  const snapshot = await coleccion.get();
  const portafolios = {};
  snapshot.forEach(doc => {
    portafolios[doc.id] = doc.data().tickers;
  });
  return portafolios;
};
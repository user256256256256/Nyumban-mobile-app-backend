const allowedOrigins = [
    'https://nyumbanapp.com',
    'https://forum.nyumbanapp.com',
    'capacitor://localhost',   // iOS/Android (Capacitor)
    'http://localhost',        // Android localhost
    'http://localhost:3000',   // Dev frontend
    'http://127.0.0.1:3000',
    'http://localhost:5050',   // Postman & curl
];
  
export const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman/curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ Blocked CORS request from:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};
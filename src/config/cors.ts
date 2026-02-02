import { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
    /* origin: function(origin, callback) {
        const whitelist = [process.env.FRONTEND_URL]

        if (process.argv[2] === '--api') {
            whitelist.push(undefined)
        }

        if (!origin || origin.startsWith("http://localhost")) {
            callback(null, true)
        } else {
            callback(new Error('Error de CORS'))
        }
    } */

    origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      origin.includes('vercel.app') ||
      origin === 'http://localhost:5173'
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS bloqueado'));
    }
  },
  credentials: true
}

/* whitelist.includes(origin) */
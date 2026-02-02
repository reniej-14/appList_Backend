import express  from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes"


dotenv.config()
connectDB()

const app = express()
app.use(cors(corsConfig))

// Loggin
app.use(morgan('dev'))

// Leer datos de formularios
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/product', productRoutes)

export default app
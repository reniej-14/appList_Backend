import { Request, Response, NextFunction } from "express"
import Tienda, { ITienda } from "../models/Tienda"

declare global {
    namespace Express {
        interface Request {
            tienda: ITienda
        }
    }
}

// Va después de authenticate: deja disponible req.tienda
export const cargarTienda = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tienda = await Tienda.findOne({ usuario: req.usuario!._id })
        if (!tienda) {
            return res.status(404).json({ error: 'Primero debes crear tu tienda' })
        }
        req.tienda = tienda
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
    }
}
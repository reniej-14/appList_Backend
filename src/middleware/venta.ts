import { Request, Response, NextFunction } from "express"
import Venta, { IVenta } from "../models/Venta"

declare global {
    namespace Express {
        interface Request {
            venta: IVenta
        }
    }
}

// Se usa con router.param('ventaId', ventaExiste)
export const ventaExiste = async (
    req: Request, res: Response, next: NextFunction, ventaId: string
) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(ventaId)) {
            return res.status(400).json({ error: 'ID de venta no válido' })
        }
        // Se busca SIEMPRE dentro de la tienda del usuario
        const venta = await Venta.findOne({ _id: ventaId, tienda: req.tienda._id })
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' })
        }
        req.venta = venta
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
    }
}
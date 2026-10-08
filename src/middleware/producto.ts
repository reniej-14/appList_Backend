import { Request, Response, NextFunction } from "express"
import Producto, { IProducto } from "../models/Producto"

declare global {
    namespace Express {
        interface Request {
            producto: IProducto
        }
    }
}

// Se usa con router.param('productoId', productoExiste)
export const productoExiste = async (
    req: Request, res: Response, next: NextFunction, productoId: string
) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(productoId)) {
            return res.status(400).json({ error: 'ID de producto no válido' })
        }
        // Se busca SIEMPRE dentro de la tienda del usuario
        const producto = await Producto.findOne({ _id: productoId, tienda: req.tienda._id })
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' })
        }
        req.producto = producto
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
    }
}
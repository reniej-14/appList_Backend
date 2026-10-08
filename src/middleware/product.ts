import type { Request, Response, NextFunction } from "express";
import Product, { IProducto} from "../models/Producto";

declare global {
    namespace Express {
        interface Request {
            product: IProducto
        }
    }
}

export async function productExists(req: Request, res: Response, next: NextFunction) {
    try {
        const { productId } = req.params
        const product = await Product.findById(productId)

        if (!product) {
            const error = new Error('Producto no encontrado')
            return res.status(404).json({error: error.message})
        }
        req.product = product
        next()
    } catch (error) {
        res.status(500).json({error: 'Hubo un error'})
    }
}
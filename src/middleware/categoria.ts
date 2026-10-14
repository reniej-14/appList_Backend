import { Request, Response, NextFunction } from "express"
import Categoria, { ICategoria } from "../models/Categoria"

declare global {
    namespace Express {
        interface Request {
            categoria: ICategoria
        }
    }
}

// Se usa con router.param('categoriaId', categoriaExiste)
export const categoriaExiste = async (
    req: Request, res: Response, next: NextFunction, categoriaId: string
) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(categoriaId)) {
            return res.status(400).json({ error: 'ID de categoría no válido' })
        }
        // Se busca SIEMPRE dentro de la tienda del usuario
        const categoria = await Categoria.findOne({ _id: categoriaId, tienda: req.tienda._id })
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' })
        }
        req.categoria = categoria
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
    }
}
import { Request, Response, NextFunction } from "express"
import Cliente, { ICliente } from "../models/Cliente"

declare global {
    namespace Express {
        interface Request {
            cliente: ICliente
        }
    }
}

// Se usa con router.param('clienteId', clienteExiste)
export const clienteExiste = async (
    req: Request, res: Response, next: NextFunction, clienteId: string
) => {
    try {
        if (!/^[0-9a-fA-F]{24}$/.test(clienteId)) {
            return res.status(400).json({ error: 'ID de cliente no válido' })
        }
        // Se busca SIEMPRE dentro de la tienda del usuario
        const cliente = await Cliente.findOne({ _id: clienteId, tienda: req.tienda._id })
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        req.cliente = cliente
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
    }
}
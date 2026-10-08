import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import Usuario, { IUsuario } from "../models/Usuario"

declare global {
    namespace Express {
        interface Request {
            usuario?: IUsuario
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        return res.status(401).json({ error: 'No autorizado' })
    }

    const token = bearer.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (typeof decoded === 'object' && decoded.id) {
            const usuario = await Usuario.findById(decoded.id).select('_id nombre email')
            if (usuario) {
                req.usuario = usuario
                return next()
            }
        }
        // Token válido en formato pero sin usuario asociado
        return res.status(401).json({ error: 'Token no válido' })
    } catch (error) {
        return res.status(401).json({ error: 'Token no válido' })
    }
}
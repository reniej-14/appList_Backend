import User from "../models/User"
import { Request, Response } from "express"
import { generateJWT } from "../utils/jwt"

export class AuthController {
    
    static createAcount = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            // Prevenir duplicados
            const userExists = await User.findOne({email})
            if (userExists) {
                const error = new Error('El usuario ya está registrado')
                return res.status(409).json({error: error.message})
            }

            // Crear un usuario
            const user = new User(req.body)

            await user.save()
            res.send('Cuenta creada correctamente')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body
            const user = await User.findOne({email})
            if (!user) {
                const error = new Error('Usuario no encontrado')
                return res.status(404).json({error: error.message})
            }

            if (!user.confirmed) {
                const error = new Error('La cuenta no ha sido confirmada')
                return res.status(401).json({error: error.message})
            }

            // Revisar password
            if (password !== user.password) {
                const error = new Error('Password incorrecto')
                return res.status(401).json({error: error.message})
            }

            const token = generateJWT({id: user._id})
            res.send(token)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static user = async (req: Request, res: Response) => {
        return res.json(req.user)
    }
}
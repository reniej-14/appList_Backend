import { Request, Response } from "express"
import Usuario from "../models/Usuario"
import { generateJWT } from "../utils/jwt"
import { compararPassword, hashPassword } from "../utils/hashPassword"

export class AuthController {

    static crearCuenta = async (req: Request, res: Response) => {
        try {
            // Solo se toman los campos permitidos (nunca req.body completo)
            const { email, password, nombre } = req.body

            // Prevenir duplicados
            const usuarioExiste = await Usuario.findOne({ email })
            if (usuarioExiste) {
                return res.status(409).json({ error: 'El usuario ya está registrado' })
            }

            const usuario = new Usuario({
                email,
                nombre,
                password: await hashPassword(password)
            })
            await usuario.save()

            res.status(201).send('Cuenta creada correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error al crear la cuenta' })
        }
    }

    static iniciarSesion = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body

            const usuario = await Usuario.findOne({ email })
            // Mismo mensaje si el email no existe o el password falla,
            // para no revelar qué correos están registrados
            if (!usuario) {
                return res.status(401).json({ error: 'Email o password incorrectos' })
            }

            const passwordCorrecto = await compararPassword(password, usuario.password)
            if (!passwordCorrecto) {
                return res.status(401).json({ error: 'Email o password incorrectos' })
            }

            // La cuenta se revisa después de validar el password
            if (!usuario.confirmado) {
                return res.status(403).json({ error: 'La cuenta no ha sido confirmada' })
            }

            const token = generateJWT({ id: usuario._id })
            res.send(token)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static usuario = async (req: Request, res: Response) => {
        return res.json(req.usuario)
    }
}
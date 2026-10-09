import { Request, Response } from "express"
import Tienda from "../models/Tienda"

export class TiendaController {

    static crearTienda = async (req: Request, res: Response) => {
        try {
            const usuarioId = req.usuario!._id

            const tiendaExiste = await Tienda.exists({ usuario: usuarioId })
            if (tiendaExiste) {
                return res.status(409).json({ error: 'Ya tienes una tienda registrada' })
            }

            // Solo los campos permitidos: nunca usuario ni ultimoRecibo desde el cliente
            const { nombre, direccion, telefono, nit, mensajeRecibo } = req.body

            const tienda = new Tienda({
                usuario: usuarioId,
                nombre,
                direccion,
                telefono,
                mensajeRecibo
            })
            await tienda.save()

            res.status(201).send('Tienda creada correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya tienes una tienda registrada' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static obtenerTienda = async (req: Request, res: Response) => {
        // req.tienda ya viene cargada por cargarTienda
        res.json(req.tienda)
    }

    static actualizarTienda = async (req: Request, res: Response) => {
        try {
            const { nombre, direccion, telefono, nit, mensajeRecibo } = req.body

            req.tienda.nombre = nombre
            req.tienda.direccion = direccion
            req.tienda.telefono = telefono
            req.tienda.mensajeRecibo = mensajeRecibo

            await req.tienda.save()
            res.send('Tienda actualizada correctamente')
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}
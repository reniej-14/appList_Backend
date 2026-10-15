import { Request, Response } from "express"
import Cliente from "../models/Cliente"
import Venta from "../models/Venta"

// Escapa los caracteres especiales para que lo que escriba el usuario
// se busque como texto y no como expresión regular
const escaparRegex = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export class ClienteController {

    static crearCliente = async (req: Request, res: Response) => {
        try {
            const { nombre, telefono, correo, direccion, DPI } = req.body

            const cliente = new Cliente({
                tienda: req.tienda._id,   // siempre desde el servidor
                nombre,
                telefono,
                direccion,
                DPI: DPI || undefined     // un DPI vacío se guarda como "sin DPI"
            })
            await cliente.save()

            res.status(201).send('Cliente creado correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe un cliente con ese DPI' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    // Todas las coincidencias, sin importar mayúsculas ni en qué parte del nombre esté el texto
    static buscarClientesPorNombre = async (req: Request, res: Response) => {
        try {
            const texto = String(req.query.nombre).trim()
            const patron = new RegExp(escaparRegex(texto), 'i')

            const clientes = await Cliente.find({
                tienda: req.tienda._id,
                nombre: patron
            })
                .sort({ nombre: 1 })
                .limit(50)

            res.json(clientes)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static buscarClientePorDPI = async (req: Request, res: Response) => {
        try {
            const cliente = await Cliente.findOne({
                tienda: req.tienda._id,
                DPI: req.params.dpi.trim()
            })
            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado' })
            }
            res.json(cliente)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static actualizarCliente = async (req: Request, res: Response) => {
        try {
            const { nombre, telefono, direccion, DPI } = req.body

            req.cliente.nombre = nombre
            req.cliente.telefono = telefono
            req.cliente.direccion = direccion
            req.cliente.DPI = DPI || undefined

            await req.cliente.save()
            res.send('Cliente actualizado correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe un cliente con ese DPI' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static eliminarCliente = async (req: Request, res: Response) => {
        try {
            // No se borra si tiene ventas: los recibos (y los créditos abiertos)
            // dependen de él
            const tieneVentas = await Venta.exists({
                tienda: req.tienda._id,
                cliente: req.cliente._id
            })
            if (tieneVentas) {
                return res.status(409).json({ error: 'El cliente tiene ventas registradas' })
            }

            await req.cliente.deleteOne()
            res.send('Cliente eliminado')
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}
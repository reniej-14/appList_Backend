import { Request, Response } from "express"
import { Types } from "mongoose"
import Producto from "../models/Producto"
import Cliente from "../models/Cliente"
import Tienda from "../models/Tienda"
import Venta, { IItemVenta } from "../models/Venta"
import { fechaHoy, inicioDelDia, inicioDelDiaSiguiente } from "../utils/fechas"

const redondear = (n: number) => Math.round(n * 100) / 100

// Así se muestra una venta que no tiene cliente
const CONSUMIDOR_FINAL = { nombre: 'Consumidor Final (CF)' }

type StockDescontado = { producto: Types.ObjectId; cantidad: number }

// Devuelve al inventario lo que ya se había descontado
const devolverStock = async (descontados: StockDescontado[]) => {
    for (const d of descontados) {
        await Producto.updateOne({ _id: d.producto }, { $inc: { stock: d.cantidad } })
    }
}

// Ventas de la tienda entre dos instantes (inicio incluido, fin no incluido),
// con filtros opcionales por tipo y estado
const consultarVentas = async (req: Request, inicio: Date, fin: Date) => {
    const filtro: Record<string, unknown> = {
        tienda: req.tienda._id,
        fecha: { $gte: inicio, $lt: fin }
    }
    if (req.query.tipo) filtro.tipo = String(req.query.tipo)
    if (req.query.estado) filtro.estado = String(req.query.estado)

    const ventas = await Venta.find(filtro)
        .sort({ fecha: -1 })
        .populate('cliente', 'nombre telefono DPI')
        .lean()

    const activas = ventas.filter((v) => v.estado !== 'anulada')

    return {
        resumen: {
            cantidad: ventas.length,
            anuladas: ventas.length - activas.length,
            // Suma de las ventas no anuladas (no es lo cobrado: incluye créditos pendientes)
            totalVentas: redondear(activas.reduce((suma, v) => suma + v.total, 0))
        },
        ventas: ventas.map((v) => ({ ...v, cliente: v.cliente ?? CONSUMIDOR_FINAL }))
    }
}

export class VentaController {

    static crearVenta = async (req: Request, res: Response) => {
        const descontados: StockDescontado[] = []

        try {
            const { tipo, cliente, items, abonoInicial } = req.body as {
                tipo: 'contado' | 'credito'
                cliente?: string
                items: { producto: string; cantidad: number }[]
                abonoInicial?: number
            }

            // No se permite el mismo producto en dos líneas
            const ids = items.map((item) => String(item.producto))
            if (new Set(ids).size !== ids.length) {
                return res.status(400).json({ error: 'Hay productos repetidos en la venta' })
            }

            // El cliente (si viene) debe ser de esta tienda
            if (cliente) {
                const clienteExiste = await Cliente.exists({ _id: cliente, tienda: req.tienda._id })
                if (!clienteExiste) {
                    return res.status(404).json({ error: 'Cliente no encontrado' })
                }
            }

            // Los precios se toman SIEMPRE de la base de datos, nunca del cliente
            const productos = await Producto.find({
                _id: { $in: ids },
                tienda: req.tienda._id,
                activo: true
            })
            if (productos.length !== ids.length) {
                return res.status(404).json({ error: 'Uno o más productos no existen o están inactivos' })
            }

            const productoPorId = new Map(productos.map((p) => [String(p._id), p]))

            const lineas: IItemVenta[] = items.map((item) => {
                const p = productoPorId.get(String(item.producto))!
                return {
                    producto: p._id,
                    codigo: p.codigo,
                    nombre: p.nombre,
                    cantidad: item.cantidad,
                    precioUnitario: p.precio,
                    subtotal: redondear(p.precio * item.cantidad)
                }
            })
            const total = redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0))

            // Abono inicial: solo a crédito y menor que el total
            const abono = abonoInicial ? redondear(Number(abonoInicial)) : 0
            if (abono > 0) {
                if (tipo !== 'credito') {
                    return res.status(400).json({ error: 'El abono inicial solo aplica a ventas a crédito' })
                }
                if (abono >= total) {
                    return res.status(400).json({
                        error: 'El abono inicial debe ser menor al total. Si el cliente paga todo, registra la venta al contado'
                    })
                }
            }

            // Descuento atómico del stock: solo se descuenta si alcanza
            for (const linea of lineas) {
                const resultado = await Producto.updateOne(
                    { _id: linea.producto, tienda: req.tienda._id, stock: { $gte: linea.cantidad } },
                    { $inc: { stock: -linea.cantidad } }
                )
                if (resultado.modifiedCount === 0) {
                    await devolverStock(descontados)
                    return res.status(409).json({ error: `Stock insuficiente para ${linea.nombre}` })
                }
                descontados.push({ producto: linea.producto, cantidad: linea.cantidad })
            }

            const numeroRecibo = await Tienda.siguienteRecibo(req.tienda._id)

            const venta = await Venta.create({
                tienda: req.tienda._id,
                cliente: cliente || null,
                numeroRecibo,
                tipo,
                items: lineas,
                total,
                abonos: abono > 0
                    ? [{ fecha: new Date(), monto: abono, nota: 'Abono inicial' }]
                    : []
            })

            res.status(201).json({
                mensaje: 'Venta registrada correctamente',
                ventaId: venta._id,
                numeroRecibo: venta.numeroRecibo,
                total: venta.total,
                saldoPendiente: venta.saldoPendiente
            })
        } catch (error) {
            // Si algo falló después de descontar, el inventario vuelve a su estado
            await devolverStock(descontados)
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static ventasDeHoy = async (req: Request, res: Response) => {
        try {
            const hoy = fechaHoy()
            const resultado = await consultarVentas(req, inicioDelDia(hoy), inicioDelDiaSiguiente(hoy))
            res.json({ fecha: hoy, ...resultado })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static ventasPorFecha = async (req: Request, res: Response) => {
        try {
            const { fecha } = req.params
            const resultado = await consultarVentas(req, inicioDelDia(fecha), inicioDelDiaSiguiente(fecha))
            res.json({ fecha, ...resultado })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static ventasPorRango = async (req: Request, res: Response) => {
        try {
            const desde = String(req.query.desde)
            const hasta = String(req.query.hasta)

            const inicio = inicioDelDia(desde)
            const fin = inicioDelDiaSiguiente(hasta)   // "hasta" se incluye completo

            const dias = (fin.getTime() - inicio.getTime()) / 86400000
            if (dias > 366) {
                return res.status(400).json({ error: 'El rango máximo es de un año' })
            }

            const resultado = await consultarVentas(req, inicio, fin)
            res.json({ desde, hasta, ...resultado })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

        // Créditos que aún no se han terminado de pagar
    static ventasPendientes = async (req: Request, res: Response) => {
        try {
            const filtro: Record<string, unknown> = {
                tienda: req.tienda._id,
                tipo: 'credito',
                estado: 'abierta'
            }
            // Opcional: solo los créditos de un cliente
            if (req.query.cliente) filtro.cliente = String(req.query.cliente)

            const ventas = await Venta.find(filtro)
                .sort({ fecha: 1 })   // los más antiguos primero
                .populate('cliente', 'nombre telefono DPI')
                .lean()

            const totalPendiente = redondear(
                ventas.reduce((suma, v) => suma + v.saldoPendiente, 0)
            )

            res.json({
                resumen: { cantidad: ventas.length, totalPendiente },
                ventas
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static registrarAbono = async (req: Request, res: Response) => {
        try {
            const venta = req.venta
            const monto = redondear(Number(req.body.monto))
            const { nota } = req.body

            if (venta.tipo !== 'credito') {
                return res.status(400).json({ error: 'Solo las ventas a crédito reciben abonos' })
            }
            if (venta.estado === 'anulada') {
                return res.status(409).json({ error: 'La venta está anulada' })
            }
            if (venta.estado === 'pagada') {
                return res.status(409).json({ error: 'La venta ya está pagada' })
            }
            if (monto > venta.saldoPendiente) {
                return res.status(400).json({
                    error: `El abono excede el saldo pendiente (Q${venta.saldoPendiente.toFixed(2)})`
                })
            }

            // La actualización es atómica: si otro abono llegó al mismo tiempo
            // y el saldo ya no alcanza, lanza error en lugar de dejarlo negativo
            const actualizada = await Venta.registrarAbono(req.tienda._id, venta._id, monto, nota)

            res.json({
                mensaje: 'Abono registrado correctamente',
                saldoPendiente: actualizada.saldoPendiente,
                estado: actualizada.estado
            })
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('Venta no encontrada')) {
                return res.status(409).json({ error: 'No se pudo registrar el abono: el saldo cambió, vuelve a intentarlo' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static anularVenta = async (req: Request, res: Response) => {
        try {
            // Cambio de estado atómico: solo una petición puede anular la venta,
            // así el stock nunca se devuelve dos veces
            const venta = await Venta.findOneAndUpdate(
                { _id: req.venta._id, tienda: req.tienda._id, estado: { $ne: 'anulada' } },
                { $set: { estado: 'anulada', saldoPendiente: 0 } },
                { new: true }
            )
            if (!venta) {
                return res.status(409).json({ error: 'La venta ya está anulada' })
            }

            // Devuelve al inventario lo vendido (las líneas y el cliente se conservan)
            await Producto.bulkWrite(
                venta.items.map((item) => ({
                    updateOne: {
                        filter: { _id: item.producto, tienda: req.tienda._id },
                        update: { $inc: { stock: item.cantidad } }
                    }
                }))
            )

            // Lo que el cliente ya pagó y habría que devolverle fuera del sistema:
            // el total si fue al contado, o la suma de sus abonos si fue a crédito
            const montoAbonado = redondear(venta.abonos.reduce((suma, a) => suma + a.monto, 0))
            const montoADevolver = venta.tipo === 'contado' ? venta.total : montoAbonado

            res.json({
                mensaje: 'Venta anulada correctamente',
                estado: venta.estado,
                montoADevolver
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}
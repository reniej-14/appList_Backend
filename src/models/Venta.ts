import mongoose, { Schema, Document, Model, Types } from "mongoose"

const redondear = (n: number) => Math.round(n * 100) / 100

export type TipoVenta = 'contado' | 'credito'
export type EstadoVenta = 'abierta' | 'pagada' | 'anulada'

// Línea del recibo: copia código, nombre y precio al momento de vender,
// para que los recibos viejos no cambien si luego editas el producto.
export interface IItemVenta {
    producto: Types.ObjectId
    codigo: string
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
}

export interface IAbono {
    fecha: Date
    monto: number
    nota?: string
}

export interface IVenta extends Document {
    tienda: Types.ObjectId
    cliente: Types.ObjectId | null
    numeroRecibo: number
    fecha: Date
    tipo: TipoVenta
    items: IItemVenta[]
    total: number
    saldoPendiente: number
    estado: EstadoVenta
    abonos: IAbono[]
}

interface IVentaModel extends Model<IVenta> {
    registrarAbono(
        tiendaId: Types.ObjectId | string,
        ventaId: Types.ObjectId | string,
        monto: number,
        nota?: string
    ): Promise<IVenta>
}

const itemSchema = new Schema<IItemVenta>({
    producto: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
}, { _id: false })

const abonoSchema = new Schema<IAbono>({
    fecha: { type: Date, default: Date.now },
    monto: { type: Number, required: true, min: 0.01 },
    nota: String
})

const ventaSchema = new Schema<IVenta, IVentaModel>({
    tienda: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', default: null },
    numeroRecibo: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    tipo: { type: String, enum: ['contado', 'credito'], required: true },
    items: { type: [itemSchema], validate: (v: IItemVenta[]) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    saldoPendiente: { type: Number, default: 0, min: 0 },
    estado: { type: String, enum: ['abierta', 'pagada', 'anulada'], default: 'pagada' },
    abonos: [abonoSchema]
})

// Al crear la venta se fijan saldo y estado según el tipo
// (la validación de "crédito requiere cliente" se hace en el middleware)
ventaSchema.pre('validate', async function (this: IVenta) {
    if (this.isNew) {
        if (this.tipo === 'credito') {
            this.saldoPendiente = this.total
            this.estado = 'abierta'
        } else {
            this.saldoPendiente = 0
            this.estado = 'pagada'
        }
    }
})

// Registrar un abono (atómico: valida estado y que no exceda el saldo)
ventaSchema.statics.registrarAbono = async function (
    this: IVentaModel,
    tiendaId: Types.ObjectId | string,
    ventaId: Types.ObjectId | string,
    monto: number,
    nota?: string
): Promise<IVenta> {
    monto = redondear(monto)
    const venta = await this.findOneAndUpdate(
        {
            _id: ventaId,
            tienda: tiendaId,
            tipo: 'credito',
            estado: 'abierta',
            saldoPendiente: { $gte: monto }
        },
        {
            $push: { abonos: { monto, nota } },
            $inc: { saldoPendiente: -monto }
        },
        { new: true }
    )
    if (!venta) throw new Error('Venta no encontrada, ya pagada, o el abono excede el saldo')

    if (redondear(venta.saldoPendiente) <= 0) {
        venta.saldoPendiente = 0
        venta.estado = 'pagada'
        await venta.save()
    }
    return venta
}

// Número de recibo único por tienda (puede repetirse entre tiendas distintas)
ventaSchema.index({ tienda: 1, numeroRecibo: 1 }, { unique: true })
// Búsqueda por fecha y filtro de pendientes
ventaSchema.index({ tienda: 1, fecha: -1 })
ventaSchema.index({ tienda: 1, estado: 1 })

const Venta = mongoose.model<IVenta, IVentaModel>('Venta', ventaSchema)
export default Venta
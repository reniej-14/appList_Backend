import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ITienda extends Document {
    usuario: Types.ObjectId
    nombre: string
    direccion?: string
    telefono?: string
    mensajeRecibo?: string
    ultimoRecibo: number
}

interface ITiendaModel extends Model<ITienda> {
    siguienteRecibo(tiendaId: Types.ObjectId | string): Promise<number>
}

const tiendaSchema = new Schema<ITienda, ITiendaModel>({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    nombre: { type: String, required: true, trim: true },
    direccion: String,
    telefono: String,
    mensajeRecibo: String,                          // ej. "Gracias por su compra"
    ultimoRecibo: { type: Number, default: 0 }      // numeración propia de cada tienda
}, { timestamps: true })

// Incremento atómico: dos ventas simultáneas nunca obtienen el mismo número
tiendaSchema.statics.siguienteRecibo = async function (
    this: ITiendaModel,
    tiendaId: Types.ObjectId | string
): Promise<number> {
    const tienda = await this.findOneAndUpdate(
        { _id: tiendaId },
        { $inc: { ultimoRecibo: 1 } },
        { new: true }
    )
    if (!tienda) throw new Error('Tienda no encontrada')
    return tienda.ultimoRecibo
}

const Tienda = mongoose.model<ITienda, ITiendaModel>('Tienda', tiendaSchema)
export default Tienda
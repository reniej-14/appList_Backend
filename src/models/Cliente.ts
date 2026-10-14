import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICliente extends Document {
    tienda: Types.ObjectId
    nombre: string
    telefono?: string
    direccion?: string
    DPI?: string
}

const clienteSchema = new Schema<ICliente>({
    tienda: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    telefono: String,
    direccion: String,
    DPI: String
}, { timestamps: true })

// El DPI no se repite dentro de una tienda (los clientes sin DPI no cuentan)
clienteSchema.index(
    { tienda: 1, DPI: 1 },
    { unique: true, partialFilterExpression: { DPI: { $type: 'string' } } }
)

const Cliente = mongoose.model<ICliente>('Cliente', clienteSchema)
export default Cliente
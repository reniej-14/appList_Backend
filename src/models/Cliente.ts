import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICliente extends Document {
    tienda: Types.ObjectId
    nombre: string
    telefono?: string
    correo?: string
    direccion?: string
    DPI?: string   // DPI / NIT
}

const clienteSchema = new Schema<ICliente>({
    tienda: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    telefono: String,
    correo: String,
    direccion: String,
    DPI: String
}, { timestamps: true })

const Cliente = mongoose.model<ICliente>('Cliente', clienteSchema)
export default Cliente
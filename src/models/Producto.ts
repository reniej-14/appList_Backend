import mongoose, { Schema, Document, Types } from "mongoose"

export interface IProducto extends Document {
    tienda: Types.ObjectId
    categoria: Types.ObjectId | null
    codigo: string        // código de barras / modelo
    nombre: string
    precio: number
    stock: number
    activo: boolean
}

const productoSchema = new Schema<IProducto>({
    tienda: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true },
    categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', default: null, index: true },
    codigo: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    activo: { type: Boolean, default: true }
}, { timestamps: true })

// El código no se repite dentro de una misma tienda
productoSchema.index({ tienda: 1, codigo: 1 }, { unique: true })

const Producto = mongoose.model<IProducto>('Producto', productoSchema)
export default Producto
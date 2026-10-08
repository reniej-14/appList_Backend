import mongoose, { Schema, Document, Types } from "mongoose"

export interface ICategoria extends Document {
    tienda: Types.ObjectId
    nombre: string
}

const categoriaSchema = new Schema<ICategoria>({
    tienda: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true },
    nombre: { type: String, required: true, trim: true }
}, { timestamps: true })

// No se repite el nombre dentro de una misma tienda
categoriaSchema.index({ tienda: 1, nombre: 1 }, { unique: true })

const Categoria = mongoose.model<ICategoria>('Categoria', categoriaSchema)
export default Categoria
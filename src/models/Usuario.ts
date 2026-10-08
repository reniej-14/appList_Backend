import mongoose, { Schema, Document } from "mongoose"

export interface IUsuario extends Document {
    email: string
    password: string
    nombre: string
    confirmado: boolean
}

const usuarioSchema = new Schema<IUsuario>({
    email: { type: String, required: true, lowercase: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, required: true, trim: true },
    confirmado: { type: Boolean, default: false }
}, { timestamps: true })

const Usuario = mongoose.model<IUsuario>('Usuario', usuarioSchema)
export default Usuario
import mongoose, { Schema, Document } from "mongoose"

export interface IUsuario extends Document {
    correo: string
    contrasena: string
    nombre: string
    confirmado: boolean
}

const usuarioSchema = new Schema<IUsuario>({
    correo: { type: String, required: true, lowercase: true, unique: true },
    contrasena: { type: String, required: true },
    nombre: { type: String, required: true, trim: true },
    confirmado: { type: Boolean, default: false }
}, { timestamps: true })

const Usuario = mongoose.model<IUsuario>('Usuario', usuarioSchema)
export default Usuario
import { Request, Response } from "express"
import Categoria from "../models/Categoria"
import Producto from "../models/Producto"

export class CategoriaController {

    static crearCategoria = async (req: Request, res: Response) => {
        try {
            const { nombre } = req.body

            const categoria = new Categoria({
                tienda: req.tienda._id,   // siempre desde el servidor
                nombre
            })
            await categoria.save()

            res.status(201).send('Categoría creada correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static obtenerCategorias = async (req: Request, res: Response) => {
        try {
            const categorias = await Categoria.find({ tienda: req.tienda._id }).sort({ nombre: 1 })
            res.json(categorias)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static obtenerCategoriaPorId = async (req: Request, res: Response) => {
        // req.categoria ya viene cargada (y verificada) por categoriaExiste
        res.json(req.categoria)
    }

    static actualizarCategoria = async (req: Request, res: Response) => {
        try {
            req.categoria.nombre = req.body.nombre
            await req.categoria.save()

            res.send('Categoría actualizada correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static eliminarCategoria = async (req: Request, res: Response) => {
        try {
            // No se borra si todavía hay productos usándola
            const enUso = await Producto.exists({
                tienda: req.tienda._id,
                categoria: req.categoria._id
            })
            if (enUso) {
                return res.status(409).json({ error: 'La categoría tiene productos asociados' })
            }

            await req.categoria.deleteOne()
            res.send('Categoría eliminada')
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}
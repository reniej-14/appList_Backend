import { Request, Response } from "express"
import Producto from "../models/Producto"
import Categoria from "../models/Categoria"

export class ProductoController {

    static crearProducto = async (req: Request, res: Response) => {
        try {
            const { codigo, nombre, precio, stock, categoria } = req.body

            if (categoria) {
                const categoriaExiste = await Categoria.exists({ _id: categoria, tienda: req.tienda._id })
                if (!categoriaExiste) {
                    return res.status(404).json({ error: 'Categoría no encontrada' })
                }
            }

            const producto = new Producto({
                tienda: req.tienda._id,   // siempre desde el servidor
                categoria: categoria || null,
                codigo,
                nombre,
                precio,
                stock
            })
            await producto.save()

            res.status(201).send('Producto creado correctamente')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe un producto con ese código' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static obtenerProductosPorCategoria = async (req: Request, res: Response) => {
        try {
            const { categoriaId } = req.params

            const filtro: Record<string, unknown> = { tienda: req.tienda._id }
            if (categoriaId.toLowerCase() !== 'todos') {
                filtro.categoria = categoriaId
            }

            const productos = await Producto.find(filtro)
                .populate('categoria', 'nombre')
                .sort({ nombre: 1 })

            // Siempre un arreglo; si está vacío, el frontend muestra su propio mensaje
            res.json(productos)
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static obtenerProductoPorId = async (req: Request, res: Response) => {
        // req.producto ya viene cargado (y verificado) por productoExiste
        res.json(req.producto)
    }

    static actualizarProducto = async (req: Request, res: Response) => {
        try {
            const { codigo, nombre, precio, stock, categoria, activo } = req.body

            if (categoria) {
                const categoriaExiste = await Categoria.exists({ _id: categoria, tienda: req.tienda._id })
                if (!categoriaExiste) {
                    return res.status(404).json({ error: 'Categoría no encontrada' })
                }
            }

            req.producto.codigo = codigo
            req.producto.nombre = nombre
            req.producto.precio = precio
            req.producto.categoria = categoria || null
            if (stock !== undefined) req.producto.stock = stock
            if (activo !== undefined) req.producto.activo = activo

            await req.producto.save()
            res.send('Producto actualizado')
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(409).json({ error: 'Ya existe un producto con ese código' })
            }
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static eliminarProducto = async (req: Request, res: Response) => {
        try {
            await req.producto.deleteOne()
            res.send('Producto eliminado')
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}
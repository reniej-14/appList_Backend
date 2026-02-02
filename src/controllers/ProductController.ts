import { Request, Response } from "express"
import Product from "../models/Product"

export class ProductController {

    static createProduct = async (req: Request, res: Response) => {
        try {
            const product = new Product(req.body)

            await product.save()
            res.send('Producto creado correctamente')
        } catch (error) {
            console.log(error)
        }
    }

    static getProductsByCategory = async (req: Request, res: Response) => {
        try {
            const { productCategory } = req.params

            const filter = productCategory === 'Todos'
                ? {}
                : { productCategory }

            const products = await Product.find(filter)

            if (!products.length) {
                res.send('No existen productos para esta categoría')
            } 
            
            res.json(products)
        } catch (error) {
            console.log
        }
    }

    static getProductById = async (req: Request, res: Response) => {
        const { productId } = req.params
        try {
            const product = await Product.findById(productId)

            if (!product) {
                const error = new Error('Producto no encontrado')
                return res.status(404).json({error: error.message})
            }

            res.json(product)
        } catch (error) {
            console.log(error)
        }
    }

    static updateProduct = async (req: Request, res: Response) => {
        try {
            req.product.productName = req.body.productName
            req.product.productCategory = req.body.productCategory
            req.product.productPrice = req.body.productPrice
            req.product.productPriceMin = req.body.productPriceMin

            await req.product.save()
            res.send('Producto actualizado')
        } catch (error) {
            console.log(error)
        }
    }

    static deleteProduct = async (req: Request, res: Response) => {
        try {
            await req.product.deleteOne()
            res.send('Producto eliminado')
        } catch (error) {
            console.log(error)
        }
    }
}
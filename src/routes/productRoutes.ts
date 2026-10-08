import { Router } from "express"
import { body, param } from "express-validator"
import { authenticate } from "../middleware/auth"
import { cargarTienda } from "../middleware/tienda"
import { handleInputErrors } from "../middleware/validation"
import { productoExiste } from "../middleware/producto"
import { ProductoController } from "../controllers/ProductController"

const router = Router()

// Todas las rutas requieren usuario autenticado y su tienda
router.use(authenticate, cargarTienda)
router.param('productoId', productoExiste)

const validacionesProducto = [
    body('codigo')
        .trim().notEmpty().withMessage('El código del producto es obligatorio'),
    body('nombre')
        .trim().notEmpty().withMessage('El nombre del producto es obligatorio'),
    body('precio')
        .isFloat({ min: 0 }).withMessage('El precio del producto no es válido'),
    body('stock')
        .optional().isInt({ min: 0 }).withMessage('El stock no es válido'),
    body('categoria')
        .optional({ nullable: true }).isMongoId().withMessage('Categoría no válida'),
]

// "todos" o el _id de una categoría
router.get('/:categoriaId/category',
    param('categoriaId').custom((valor: string) => {
        if (valor.toLowerCase() === 'todos' || /^[0-9a-fA-F]{24}$/.test(valor)) return true
        throw new Error('Categoría no válida')
    }),
    handleInputErrors,
    ProductoController.obtenerProductosPorCategoria
)

router.post('/create',
    ...validacionesProducto,
    handleInputErrors,
    ProductoController.crearProducto
)

router.get('/:productoId',
    ProductoController.obtenerProductoPorId
)

router.put('/update/:productoId',
    ...validacionesProducto,
    handleInputErrors,
    ProductoController.actualizarProducto
)

router.delete('/delete/:productoId',
    ProductoController.eliminarProducto
)

export default router
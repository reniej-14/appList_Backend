import { Router } from "express"
import { body } from "express-validator"
import { authenticate } from "../middleware/auth"
import { cargarTienda } from "../middleware/tienda"
import { handleInputErrors } from "../middleware/validation"
import { categoriaExiste } from "../middleware/categoria"
import { CategoriaController } from "../controllers/CategoriaController"

const router = Router()

// Todas las rutas requieren usuario autenticado y su tienda
router.use(authenticate, cargarTienda)
router.param('categoriaId', categoriaExiste)

const validacionesCategoria = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre de la categoría es obligatorio')
        .isLength({ max: 100 }).withMessage('El nombre de la categoría es muy largo'),
]

router.post('/create',
    ...validacionesCategoria,
    handleInputErrors,
    CategoriaController.crearCategoria
)

router.get('/',
    CategoriaController.obtenerCategorias
)

router.get('/:categoriaId',
    CategoriaController.obtenerCategoriaPorId
)

router.put('/update/:categoriaId',
    ...validacionesCategoria,
    handleInputErrors,
    CategoriaController.actualizarCategoria
)

router.delete('/delete/:categoriaId',
    CategoriaController.eliminarCategoria
)

export default router
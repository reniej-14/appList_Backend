import { Router } from "express"
import { body } from "express-validator"
import { authenticate } from "../middleware/auth"
import { cargarTienda } from "../middleware/tienda"
import { handleInputErrors } from "../middleware/validation"
import { TiendaController } from "../controllers/TiendaController"

const router = Router()

router.use(authenticate)

const validacionesTienda = [
    body('nombre')
        .trim().notEmpty().withMessage('El nombre de la tienda es obligatorio'),
    body('direccion')
        .optional().trim().isLength({ max: 255 }).withMessage('La dirección es muy larga'),
    body('telefono')
        .optional().trim().isLength({ max: 30 }).withMessage('El teléfono es muy largo'),
    body('nit')
        .optional().trim().isLength({ max: 30 }).withMessage('El NIT es muy largo'),
    body('mensajeRecibo')
        .optional().trim().isLength({ max: 255 }).withMessage('El mensaje del recibo es muy largo'),
]

// Aquí NO va cargarTienda: el usuario todavía no tiene tienda
router.post('/',
    ...validacionesTienda,
    handleInputErrors,
    TiendaController.crearTienda
)

router.get('/',
    cargarTienda,
    TiendaController.obtenerTienda
)

router.put('/',
    cargarTienda,
    ...validacionesTienda,
    handleInputErrors,
    TiendaController.actualizarTienda
)

export default router
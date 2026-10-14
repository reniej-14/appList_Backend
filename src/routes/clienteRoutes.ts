import { Router } from "express"
import { body, param, query } from "express-validator"
import { authenticate } from "../middleware/auth"
import { cargarTienda } from "../middleware/tienda"
import { handleInputErrors } from "../middleware/validation"
import { clienteExiste } from "../middleware/cliente"
import { ClienteController } from "../controllers/ClienteController"

const router = Router()

// Todas las rutas requieren usuario autenticado y su tienda
router.use(authenticate, cargarTienda)
router.param('clienteId', clienteExiste)

const validacionesCliente = [
    body('nombre')
        .trim().notEmpty().withMessage('El nombre del cliente es obligatorio')
        .isLength({ max: 150 }).withMessage('El nombre es muy largo'),
    body('telefono')
        .optional().trim().isLength({ max: 30 }).withMessage('El teléfono es muy largo'),
    body('direccion')
        .optional().trim().isLength({ max: 255 }).withMessage('La dirección es muy larga'),
    body('DPI')
        .optional().trim().isLength({ max: 30 }).withMessage('El DPI es muy largo'),
]

router.post('/create',
    ...validacionesCliente,
    handleInputErrors,
    ClienteController.crearCliente
)

// GET /api/clientes/buscar?nombre=Pablo
router.get('/buscar',
    query('nombre')
        .isString().trim().notEmpty().withMessage('Escribe el nombre a buscar'),
    handleInputErrors,
    ClienteController.buscarClientesPorNombre
)

router.get('/dpi/:dpi',
    param('dpi').trim().notEmpty().withMessage('El DPI es obligatorio'),
    handleInputErrors,
    ClienteController.buscarClientePorDPI
)

router.put('/update/:clienteId',
    ...validacionesCliente,
    handleInputErrors,
    ClienteController.actualizarCliente
)

router.delete('/delete/:clienteId',
    ClienteController.eliminarCliente
)

export default router
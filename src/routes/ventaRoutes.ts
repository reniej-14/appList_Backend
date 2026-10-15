import { Router } from "express"
import { body, param, query } from "express-validator"
import { authenticate } from "../middleware/auth"
import { cargarTienda } from "../middleware/tienda"
import { ventaExiste } from "../middleware/venta"
import { handleInputErrors } from "../middleware/validation"
import { VentaController } from "../controllers/VentaController"

const router = Router()

// Todas las rutas requieren usuario autenticado y su tienda
router.use(authenticate, cargarTienda)
router.param('ventaId', ventaExiste)

// Fecha con formato YYYY-MM-DD y que exista en el calendario
const esFecha = (valor: unknown) =>
    typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !isNaN(Date.parse(valor))

// Filtros opcionales para los listados de ventas
const filtrosListado = [
    query('tipo')
        .optional().isIn(['contado', 'credito']).withMessage('Tipo no válido'),
    query('estado')
        .optional().isIn(['abierta', 'pagada', 'anulada']).withMessage('Estado no válido'),
]

router.post('/create',
    body('tipo')
        .isIn(['contado', 'credito']).withMessage('Tipo de venta no válido'),
    body('cliente')
        .if(body('tipo').equals('credito'))
        .notEmpty().withMessage('Una venta a crédito requiere un cliente'),
    body('cliente')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage('Cliente no válido'),
    body('items')
        .isArray({ min: 1 }).withMessage('La venta necesita al menos un producto'),
    body('items.*.producto')
        .isMongoId().withMessage('Producto no válido'),
    body('items.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor que 0'),
    body('abonoInicial')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0.01 }).withMessage('El abono inicial no es válido'),
    handleInputErrors,
    VentaController.crearVenta
)

// Ventas de hoy
router.get('/hoy',
    ...filtrosListado,
    handleInputErrors,
    VentaController.ventasDeHoy
)

// Ventas de una fecha: /fecha/2026-10-14
router.get('/fecha/:fecha',
    param('fecha')
        .custom(esFecha).withMessage('Fecha no válida, usa el formato AAAA-MM-DD'),
    ...filtrosListado,
    handleInputErrors,
    VentaController.ventasPorFecha
)

// Ventas de un rango: /rango?desde=2026-10-01&hasta=2026-10-14
router.get('/rango',
    query('desde')
        .custom(esFecha).withMessage('La fecha "desde" no es válida, usa el formato AAAA-MM-DD'),
    query('hasta')
        .custom(esFecha).withMessage('La fecha "hasta" no es válida, usa el formato AAAA-MM-DD')
        .bail()
        .custom((hasta, { req }) => {
            if (hasta < String(req.query?.desde)) {
                throw new Error('La fecha "hasta" no puede ser anterior a "desde"')
            }
            return true
        }),
    ...filtrosListado,
    handleInputErrors,
    VentaController.ventasPorRango
)

// Créditos pendientes: /pendientes  (opcional: ?cliente=ID_DEL_CLIENTE)
router.get('/pendientes',
    query('cliente')
        .optional().isMongoId().withMessage('Cliente no válido'),
    handleInputErrors,
    VentaController.ventasPendientes
)

router.post('/abonar/:ventaId',
    body('monto')
        .isFloat({ min: 0.01 }).withMessage('El monto del abono no es válido'),
    body('nota')
        .optional().trim().isLength({ max: 255 }).withMessage('La nota es muy larga'),
    handleInputErrors,
    VentaController.registrarAbono
)

router.patch('/anular/:ventaId',
    VentaController.anularVenta
)

export default router
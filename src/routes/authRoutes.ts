import { Router } from "express"
import { body } from "express-validator"
import { handleInputErrors } from "../middleware/validation"
import { AuthController } from "../controllers/AuthController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.post('/create-account',
    body('nombre')
        .trim().notEmpty().withMessage('El nombre no puede ir vacío'),
    body('password')
        .isLength({ min: 8 }).withMessage('El password es muy corto, mínimo 8 caracteres'),
    body('password_confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Los password no son iguales')
        }
        return true
    }),
    body('email')
        .isEmail().withMessage('Email no válido'),
    handleInputErrors,
    AuthController.crearCuenta
)

router.post('/login',
    body('email')
        .isEmail().withMessage('Email no válido'),
    body('password')
        .notEmpty().withMessage('El password no puede ir vacío'),
    handleInputErrors,
    AuthController.iniciarSesion
)

router.get('/user',
    authenticate,
    AuthController.usuario
)

export default router
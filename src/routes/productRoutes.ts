import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate } from "../middleware/auth";
import { handleInputErrors } from "../middleware/validation";
import { ProductController } from "../controllers/ProductController";
import { productExists } from "../middleware/product";


const router = Router()

router.get('/:productCategory/category', 
    param('productCategory')
        .notEmpty().withMessage('La categoría del producto es obligatoria'),
    handleInputErrors,
    ProductController.getProductsByCategory
)

router.use(authenticate)

router.post('/create',
    body('productName')
        .notEmpty().withMessage('El nombre del producto es obligatorio'),
    body('productCategory')
        .notEmpty().withMessage('La categoría del producto es obligatoria'),
    body('productPrice')
        .notEmpty().withMessage('El precio normal del producto es obligatorio'),
    body('productPriceMin')
        .notEmpty().withMessage('El precio minimo del producto es obligatorio'),
    handleInputErrors,
    ProductController.createProduct
)

router.param('productId', productExists)

router.get('/:productId', 
    param('productId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProductController.getProductById
)

router.put('/update/:productId',
    param('productId')
        .isMongoId().withMessage('ID no válido'),
    body('productName')
        .notEmpty().withMessage('El nombre del producto es obligatorio'),
    body('productCategory')
        .notEmpty().withMessage('La categoría del producto es obligatoria'),
    body('productPrice')
        .notEmpty().withMessage('El precio normal del producto es obligatorio'),
    body('productPriceMin')
        .notEmpty().withMessage('El precio minimo del producto es obligatorio'),
    handleInputErrors,
    ProductController.updateProduct
)

router.delete('/delete/:productId',
    param('productId').isMongoId().withMessage('ID no válido'),
    handleInputErrors,
    ProductController.deleteProduct
)

export default router
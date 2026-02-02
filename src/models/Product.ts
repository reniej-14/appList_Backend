import mongoose, { Document, Number, Schema } from "mongoose";


export type ProductType = Document & {
    productName: string
    productCategory: string
    productPrice: number
    productPriceMin: number
}

const ProductSchema: Schema = new Schema({
    productName: {
        type: String,
        require: true,
        trim: true
    },
    productCategory: {
        type: String,
        require: true,
        trim: true
    },
    productPrice: {
        type: Number,
        require: true,
        trim: true
    },
    productPriceMin: {
        type: Number,
        require: true,
        trim: true
    }
}, {timestamps: true})

const Product = mongoose.model<ProductType>('Product', ProductSchema)
export default Product
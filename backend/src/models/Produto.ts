import mongoose, { Schema, Document } from 'mongoose';

export interface IProduto extends Document {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  cost?: number;
  price: number;
  promotional_price?: number;
  stock: number;
  image?: string;
  fornecedor_id?: mongoose.Types.ObjectId;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProdutoSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      min: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    promotional_price: {
      type: Number,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    image: {
      type: String,
      trim: true
    },
    fornecedor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Fornecedor'
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Índices para melhor performance
ProdutoSchema.index({ name: 1 });
ProdutoSchema.index({ category: 1 });
ProdutoSchema.index({ brand: 1 });
ProdutoSchema.index({ ativo: 1 });
ProdutoSchema.index({ stock: 1 });

// Virtual para verificar se tem promoção ativa
ProdutoSchema.virtual('hasPromotion').get(function (this: IProduto) {
  return this.promotional_price &&
         this.promotional_price > 0 &&
         this.promotional_price < this.price;
});

// Virtual para pegar preço final
ProdutoSchema.virtual('finalPrice').get(function (this: IProduto) {
  if (this.promotional_price && this.promotional_price > 0 && this.promotional_price < this.price) {
    return this.promotional_price;
  }
  return this.price;
});

export default mongoose.model<IProduto>('Produto', ProdutoSchema);

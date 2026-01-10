import mongoose, { Schema, Document } from 'mongoose';

export interface IVendaItem {
  produto_id: mongoose.Types.ObjectId;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface IVenda extends Document {
  cliente_id?: mongoose.Types.ObjectId;
  cliente_nome?: string;
  subtotal: number;
  desconto_tipo?: 'percentual' | 'valor';
  desconto_valor?: number;
  total: number;
  valor_pago?: number;
  troco?: number;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  payment_method?: string;
  shipping_value: number;
  itens: IVendaItem[];
  createdAt: Date;
  updatedAt: Date;
}

const VendaItemSchema: Schema = new Schema(
  {
    produto_id: {
      type: Schema.Types.ObjectId,
      ref: 'Produto',
      required: true
    },
    produto_nome: {
      type: String,
      required: true
    },
    quantidade: {
      type: Number,
      required: true,
      min: 1
    },
    preco_unitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const VendaSchema: Schema = new Schema(
  {
    cliente_id: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente'
    },
    cliente_nome: {
      type: String,
      trim: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    desconto_tipo: {
      type: String,
      enum: ['percentual', 'valor'],
      required: false
    },
    desconto_valor: {
      type: Number,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    valor_pago: {
      type: Number,
      min: 0
    },
    troco: {
      type: Number,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ['pendente', 'pago', 'cancelado'],
      default: 'pendente'
    },
    observacoes: {
      type: String,
      trim: true
    },
    payment_method: {
      type: String,
      trim: true
    },
    shipping_value: {
      type: Number,
      default: 0,
      min: 0
    },
    itens: {
      type: [VendaItemSchema],
      required: true,
      validate: {
        validator: function (v: IVendaItem[]) {
          return v && v.length > 0;
        },
        message: 'A venda deve ter pelo menos um item'
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Índices para melhor performance
VendaSchema.index({ cliente_id: 1 });
VendaSchema.index({ status: 1 });
VendaSchema.index({ createdAt: -1 });
VendaSchema.index({ 'itens.produto_id': 1 });

// Middleware para popular nome do cliente antes de salvar
VendaSchema.pre('save', async function (this: IVenda) {
  if (this.cliente_id && !this.cliente_nome) {
    const Cliente = mongoose.model('Cliente');
    const cliente = await Cliente.findById(this.cliente_id);
    if (cliente) {
      this.cliente_nome = (cliente as any).name;
    }
  }
});

export default mongoose.model<IVenda>('Venda', VendaSchema);

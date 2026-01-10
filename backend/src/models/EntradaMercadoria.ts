import mongoose, { Schema, Document } from 'mongoose';

export interface IItemEntrada {
  produto_id: mongoose.Types.ObjectId;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
}

export interface IEntradaMercadoria extends Document {
  numero_nota?: string;
  fornecedor_id: mongoose.Types.ObjectId;
  data_entrada: Date;
  itens: IItemEntrada[];
  custo_total: number;
  observacoes?: string;
  usuario_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ItemEntradaSchema = new Schema({
  produto_id: {
    type: Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 0.01
  },
  custo_unitario: {
    type: Number,
    required: true,
    min: 0
  },
  custo_total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const EntradaMercadoriaSchema: Schema = new Schema(
  {
    numero_nota: {
      type: String,
      trim: true
    },
    fornecedor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Fornecedor',
      required: true
    },
    data_entrada: {
      type: Date,
      required: true,
      default: Date.now
    },
    itens: {
      type: [ItemEntradaSchema],
      required: true,
      validate: {
        validator: function(v: IItemEntrada[]) {
          return v && v.length > 0;
        },
        message: 'A entrada deve ter pelo menos um item'
      }
    },
    custo_total: {
      type: Number,
      required: true,
      min: 0
    },
    observacoes: {
      type: String,
      trim: true
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
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
EntradaMercadoriaSchema.index({ fornecedor_id: 1 });
EntradaMercadoriaSchema.index({ data_entrada: -1 });
EntradaMercadoriaSchema.index({ usuario_id: 1 });
EntradaMercadoriaSchema.index({ numero_nota: 1 });

export default mongoose.model<IEntradaMercadoria>('EntradaMercadoria', EntradaMercadoriaSchema);

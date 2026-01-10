import mongoose, { Schema, Document } from 'mongoose';

export interface IFornecedor extends Document {
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  site?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FornecedorSchema: Schema = new Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true
    },
    razao_social: {
      type: String,
      trim: true
    },
    cnpj: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    telefone: {
      type: String,
      trim: true
    },
    celular: {
      type: String,
      trim: true
    },
    endereco: {
      type: String,
      trim: true
    },
    bairro: {
      type: String,
      trim: true
    },
    cidade: {
      type: String,
      trim: true
    },
    estado: {
      type: String,
      trim: true,
      maxlength: 2
    },
    cep: {
      type: String,
      trim: true
    },
    site: {
      type: String,
      trim: true
    },
    observacoes: {
      type: String,
      trim: true
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
FornecedorSchema.index({ nome: 1 });
FornecedorSchema.index({ cnpj: 1 });
FornecedorSchema.index({ ativo: 1 });

export default mongoose.model<IFornecedor>('Fornecedor', FornecedorSchema);

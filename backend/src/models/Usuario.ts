import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'super_admin' | 'admin' | 'gerente' | 'vendedor' | 'visualizador';

export interface IUsuario extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  ativo: boolean;
  avatar?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roleName: string; // Virtual field
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UsuarioSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [3, 'Nome deve ter no mínimo 3 caracteres']
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false // Não retorna senha por padrão nas queries
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'gerente', 'vendedor', 'visualizador'],
      default: 'vendedor'
    },
    ativo: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    lastLogin: {
      type: Date
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
        delete ret.password; // Nunca retorna senha no JSON
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  }
);

// Índices
UsuarioSchema.index({ email: 1 }, { unique: true });
UsuarioSchema.index({ role: 1 });
UsuarioSchema.index({ ativo: 1 });

// Middleware: Hash password antes de salvar
UsuarioSchema.pre('save', async function (this: IUsuario) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método: Comparar senha
UsuarioSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: Nome da role em português
UsuarioSchema.virtual('roleName').get(function (this: IUsuario) {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    gerente: 'Gerente',
    vendedor: 'Vendedor',
    visualizador: 'Visualizador'
  };
  return roleNames[this.role];
});

export default mongoose.model<IUsuario>('Usuario', UsuarioSchema);

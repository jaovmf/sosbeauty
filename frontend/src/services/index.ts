// Exportação centralizada de todos os serviços

export { default as produtosService } from './produtos';
export { default as clientesService } from './clientes';
export { default as vendasService } from './vendas';
export { default as relatoriosService } from './relatorios';

// Exportar também o cliente base da API
export { default as api } from '../lib/api';
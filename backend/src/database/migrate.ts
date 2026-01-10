/**
 * Script de Migração: SQLite → MongoDB
 *
 * Este script migra todos os dados do banco SQLite para MongoDB
 *
 * Uso:
 *   npm run migrate
 */

import { database as sqliteDb } from './database';
import { connectMongoDB, disconnectMongoDB } from './mongodb';
import Cliente from '../models/Cliente';
import Produto from '../models/Produto';
import Venda from '../models/Venda';

interface SQLiteCliente {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  created_at: string;
  updated_at: string;
}

interface SQLiteProduto {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  cost?: number;
  price: number;
  promotional_price?: number;
  stock: number;
  image?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface SQLiteVenda {
  id: number;
  cliente_id?: number;
  total: number;
  status: string;
  observacoes?: string;
  payment_method?: string;
  shipping_value: number;
  created_at: string;
  updated_at: string;
}

interface SQLiteVendaItem {
  id: number;
  venda_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

async function migrate() {
  console.log('🚀 Iniciando migração SQLite → MongoDB\n');

  try {
    // Conectar ao MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB conectado\n');

    const db = sqliteDb.getDatabase();

    // Limpar collections do MongoDB (opcional - comentar se não quiser limpar)
    console.log('🗑️  Limpando collections do MongoDB...');
    await Cliente.deleteMany({});
    await Produto.deleteMany({});
    await Venda.deleteMany({});
    console.log('✅ Collections limpas\n');

    // Migrar Clientes
    console.log('📋 Migrando clientes...');
    const clientes = await new Promise<SQLiteCliente[]>((resolve, reject) => {
      db.all('SELECT * FROM clientes', [], (err, rows: any) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const clienteIdMap = new Map<number, string>(); // SQLite ID → MongoDB ID

    for (const cliente of clientes) {
      const novoCliente = new Cliente({
        name: cliente.name,
        email: cliente.email,
        phone: cliente.phone,
        street: cliente.street,
        neighborhood: cliente.neighborhood,
        city: cliente.city,
        state: cliente.state,
        zipCode: cliente.zipCode,
        createdAt: new Date(cliente.created_at),
        updatedAt: new Date(cliente.updated_at)
      });

      await novoCliente.save();
      clienteIdMap.set(cliente.id, novoCliente._id.toString());
    }

    console.log(`✅ ${clientes.length} clientes migrados\n`);

    // Migrar Produtos
    console.log('📦 Migrando produtos...');
    const produtos = await new Promise<SQLiteProduto[]>((resolve, reject) => {
      db.all('SELECT * FROM produtos', [], (err, rows: any) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const produtoIdMap = new Map<number, string>(); // SQLite ID → MongoDB ID

    for (const produto of produtos) {
      const novoProduto = new Produto({
        name: produto.name,
        brand: produto.brand,
        description: produto.description,
        category: produto.category,
        cost: produto.cost,
        price: produto.price,
        promotional_price: produto.promotional_price,
        stock: produto.stock,
        image: produto.image,
        ativo: Boolean(produto.ativo),
        createdAt: new Date(produto.created_at),
        updatedAt: new Date(produto.updated_at)
      });

      await novoProduto.save();
      produtoIdMap.set(produto.id, novoProduto._id.toString());
    }

    console.log(`✅ ${produtos.length} produtos migrados\n`);

    // Migrar Vendas e seus itens
    console.log('💰 Migrando vendas e itens...');
    const vendas = await new Promise<SQLiteVenda[]>((resolve, reject) => {
      db.all('SELECT * FROM vendas ORDER BY id', [], (err, rows: any) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const venda of vendas) {
      // Buscar itens da venda
      const itens = await new Promise<SQLiteVendaItem[]>((resolve, reject) => {
        db.all(
          'SELECT * FROM venda_itens WHERE venda_id = ?',
          [venda.id],
          (err, rows: any) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Buscar nome do produto para cada item
      const itensProcessados = await Promise.all(
        itens.map(async (item) => {
          const produto = await new Promise<any>((resolve, reject) => {
            db.get(
              'SELECT name FROM produtos WHERE id = ?',
              [item.produto_id],
              (err, row: any) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          const produtoMongoId = produtoIdMap.get(item.produto_id);
          if (!produtoMongoId) {
            console.warn(`⚠️  Produto ${item.produto_id} não encontrado no mapa`);
          }

          return {
            produto_id: produtoMongoId,
            produto_nome: produto?.name || 'Produto não encontrado',
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal
          };
        })
      );

      // Buscar nome do cliente
      let cliente_nome;
      if (venda.cliente_id) {
        const cliente = await new Promise<any>((resolve, reject) => {
          db.get(
            'SELECT name FROM clientes WHERE id = ?',
            [venda.cliente_id],
            (err, row: any) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        cliente_nome = cliente?.name;
      }

      const clienteMongoId = venda.cliente_id
        ? clienteIdMap.get(venda.cliente_id)
        : undefined;

      const novaVenda = new Venda({
        cliente_id: clienteMongoId,
        cliente_nome,
        total: venda.total,
        status: venda.status,
        observacoes: venda.observacoes,
        payment_method: venda.payment_method,
        shipping_value: venda.shipping_value || 0,
        itens: itensProcessados,
        createdAt: new Date(venda.created_at),
        updatedAt: new Date(venda.updated_at)
      });

      await novaVenda.save();
    }

    console.log(`✅ ${vendas.length} vendas migradas\n`);

    // Resumo
    console.log('\n📊 RESUMO DA MIGRAÇÃO\n');
    console.log('━'.repeat(50));
    console.log(`Clientes:  ${clientes.length}`);
    console.log(`Produtos:  ${produtos.length}`);
    console.log(`Vendas:    ${vendas.length}`);
    console.log('━'.repeat(50));
    console.log('\n✅ Migração concluída com sucesso!\n');

    // Verificação
    console.log('🔍 Verificando dados no MongoDB...\n');
    const clientesCount = await Cliente.countDocuments();
    const produtosCount = await Produto.countDocuments();
    const vendasCount = await Venda.countDocuments();

    console.log(`Clientes no MongoDB:  ${clientesCount}`);
    console.log(`Produtos no MongoDB:  ${produtosCount}`);
    console.log(`Vendas no MongoDB:    ${vendasCount}\n`);

    if (
      clientesCount === clientes.length &&
      produtosCount === produtos.length &&
      vendasCount === vendas.length
    ) {
      console.log('✅ Verificação OK - Todos os dados foram migrados corretamente!\n');
    } else {
      console.log('⚠️  ATENÇÃO: Divergência nos números - verifique os dados\n');
    }

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    // Fechar conexões
    sqliteDb.close();
    await disconnectMongoDB();
  }

  process.exit(0);
}

// Executar migração
migrate();

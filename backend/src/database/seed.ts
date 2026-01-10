import { database } from './database';

const produtosIniciais = [
  { name: 'Fio Yy volume brasileiro 8mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 4, image: null },
  { name: 'Fio Yy volume brasileiro 9mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 7, image: null },
  { name: 'Fio Yy volume brasileiro 10mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 48, image: null },
  { name: 'Fio Yy volume brasileiro 11mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 42, image: null },
  { name: 'Fio Yy volume brasileiro 12mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 41, image: null },
  { name: 'Fio Yy volume brasileiro 13mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 44, image: null },
  { name: 'Fio Yy volume brasileiro 14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 10, image: null },
  { name: 'Fio Yy volume brasileiro MIX 8-12mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 27, image: null },
  { name: 'Fio Yy volume brasileiro MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 13.00, price: 29.99, stock: 20, image: null },
  { name: 'Fio 5D volume egípcio 8mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 2, image: null },
  { name: 'Fio 5D volume egípcio 9mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 3, image: null },
  { name: 'Fio 5D volume egípcio 10mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 4, image: null },
  { name: 'Fio 5D volume egípcio 11mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 2, image: null },
  { name: 'Fio 5D volume egípcio 12mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 5, image: null },
  { name: 'Fio 5D volume egípcio 13mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 16, image: null },
  { name: 'Fio 5D volume egípcio MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 28.00, price: 54.99, stock: 0, image: null },
  { name: 'Fio 3D duplo volume egípcio 8mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 1, image: null },
  { name: 'Fio 3D duplo volume egípcio 9mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 3, image: null },
  { name: 'Fio 3D duplo volume egípcio 10mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 6, image: null },
  { name: 'Fio 3D duplo volume egípcio 11mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 8, image: null },
  { name: 'Fio 3D duplo volume egípcio 12mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 2, image: null },
  { name: 'Fio 3D duplo volume egípcio 13mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 10, image: null },
  { name: 'Fio 3D duplo volume egípcio MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 5, image: null },
  { name: 'Fio 4D M fox MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 35.00, price: 69.99, stock: 5, image: null },
  { name: 'Fio Yy volume brasileiro marrom MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 18.00, price: 39.99, stock: 6, image: null },
  { name: 'Fio Yy volume brasileiro MIX 8-14mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 17.00, price: 31.99, stock: 1, image: null },
  { name: 'Cola HS-16', brand: 'HS', description: '', category: 'Cola', cost: 48.00, price: 75.99, stock: 3, image: null },
  { name: 'Cola Ruby', brand: 'MASTER ELITE', description: '', category: 'Cola', cost: 54.00, price: 79.99, stock: 3, image: null },
  { name: 'Cola Emerald', brand: 'MASTER ELITE', description: '', category: 'Cola', cost: 54.00, price: 79.99, stock: 4, image: null },
  { name: 'Lash Shampoo', brand: 'NAGARAKU', description: '', category: 'Higiene', cost: 20.00, price: 34.99, stock: 3, image: null },
  { name: 'Espuma Soft Snow', brand: 'CHERRY', description: '', category: 'Higiene', cost: 48.00, price: 69.99, stock: 4, image: null },
  { name: 'Primer', brand: 'CHERRY', description: '', category: 'Primer', cost: 29.00, price: 49.99, stock: 4, image: null },
  { name: 'Finalizador', brand: 'CHERRY', description: '', category: 'Finalizador', cost: 33.50, price: 59.99, stock: 3, image: null },
  { name: 'Removedor Caneta', brand: 'NAVINA', description: '', category: 'Removedor', cost: 10.50, price: 20.99, stock: 8, image: null },
  { name: 'Removedor Pasta', brand: 'NAVINA', description: '', category: 'Removedor', cost: 15.00, price: 29.99, stock: 0, image: null },
  { name: 'Ventilador', brand: 'SMD', description: '', category: 'Ventilador', cost: 15.00, price: 29.99, stock: 1, image: null },
  { name: 'Pinça Curva', brand: 'ZOLO', description: '', category: 'Pinça', cost: 6.50, price: 14.99, stock: 6, image: null },
  { name: 'Pinça Semi-curva', brand: 'ZOLO', description: '', category: 'Pinça', cost: 6.50, price: 14.99, stock: 13, image: null },
  { name: 'Pinça L', brand: 'ZOLO', description: '', category: 'Pinça', cost: 6.50, price: 14.99, stock: 4, image: null },
  { name: 'Escovinha preta UN', brand: 'SMD', description: '', category: 'Descartáveis', cost: 0.06, price: 0.80, stock: 50, image: null },
  { name: 'Escovinha rosa UN', brand: 'SMD', description: '', category: 'Descartáveis', cost: 0.06, price: 0.80, stock: 49, image: null },
  { name: 'Escovinha preta PCT', brand: 'SMD', description: '', category: 'Descartáveis', cost: 3.00, price: 9.99, stock: 13, image: null },
  { name: 'Escovinha rosa PCT', brand: 'SMD', description: '', category: 'Descartáveis', cost: 3.00, price: 9.99, stock: 24, image: null },
  { name: 'Lip gloss', brand: 'SMD', description: '', category: 'Descartáveis', cost: 3.00, price: 9.99, stock: 13, image: null },
  { name: 'Microbrush', brand: 'SMD', description: '', category: 'Descartáveis', cost: 3.00, price: 6.99, stock: 41, image: null },
  { name: 'Fita micropore', brand: 'SMD', description: '', category: 'Descartáveis', cost: 1.25, price: 4.50, stock: 9, image: null },
  { name: 'Fita transpore', brand: 'SMD', description: '', category: 'Descartáveis', cost: 1.25, price: 4.50, stock: 12, image: null },
  { name: 'Anel de batoque', brand: 'SMD', description: '', category: 'Descartáveis', cost: 5.50, price: 12.99, stock: 4, image: null },
  { name: 'Pad em gel', brand: 'SMD', description: '', category: 'Descartáveis', cost: 9.00, price: 19.99, stock: 22, image: null },
  { name: 'Disco flor pétala', brand: 'SMD', description: '', category: 'Descartáveis', cost: 0.28, price: 1.99, stock: 88, image: null },
  { name: 'Cola ONE', brand: 'CHERRY', description: '', category: 'Cola', cost: 52.50, price: 79.99, stock: 2, image: null },
  { name: 'Fio Yy volume brasileiro 9mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 13.00, price: 32.99, stock: 5, image: null },
  { name: 'Fio Yy volume brasileiro 10mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 13.00, price: 32.99, stock: 5, image: null },
  { name: 'Fio Yy volume brasileiro 11mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 13.00, price: 32.99, stock: 5, image: null },
  { name: 'Fio Yy volume brasileiro 12mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 13.00, price: 32.99, stock: 5, image: null },
  { name: 'Fio Yy volume brasileiro 13mm', brand: 'DECEMARS', description: '', category: 'Fio', cost: 13.00, price: 32.99, stock: 5, image: null },
  { name: 'Fio 4D volume egípcio MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 24.50, price: 49.99, stock: 5, image: null },
  { name: 'Fio 4D marrom MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 30.00, price: 59.99, stock: 4, image: null },
  { name: 'Fio 0,20 volume clássico MIX 8-15mm', brand: 'NAGARAKU', description: '', category: 'Fio', cost: 15.50, price: 30.99, stock: 5, image: null },
  { name: 'Fio U MIX 8-12mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 19.00, price: 39.99, stock: 5, image: null },
  { name: 'Fio U MIX 8-14mm', brand: 'FADVAN', description: '', category: 'Fio', cost: 19.00, price: 39.99, stock: 2, image: null },
  { name: 'Fio 0,07 volume clássico MIX 7-15mm', brand: 'NAGARAKU', description: '', category: 'Fio', cost: 15.50, price: 30.99, stock: 4, image: null }
];


const clientesIniciais = [
  {
    name: 'Cleisse Amanda Nogueira',
    email: 'cleisse123@hotmail.com',
    phone: '(49) 99935-5611',
    street: 'Rua Lages, 270',
    neighborhood: 'Centro',
    city: 'Curitibanos',
    state: 'SC',
    zipCode: '89520-000'
  },
  {
    name: 'João Victor Marcon Fontana',
    email: 'joaovmarconf@hotmail.com',
    phone: '(49) 98810-6106',
    street: 'Rua Lages, 270',
    neighborhood: 'Centro',
    city: 'Curitibanos',
    state: 'SC',
    zipCode: '89520-000'
  }
];

export async function seedDatabase(): Promise<void> {
  const db = database.getDatabase();

  console.log('🌱 Iniciando seed do banco de dados...');

  // Inserir produtos
  console.log('📦 Inserindo produtos...');
  const produtoSql = 'INSERT INTO produtos (name, brand, description, category, cost, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  for (const produto of produtosIniciais) {
    await new Promise<void>((resolve, reject) => {
      db.run(produtoSql, [produto.name, produto.brand, produto.description, produto.category, produto.cost, produto.price, produto.stock, produto.image], (err) => {
        if (err) {
          console.error(`Erro ao inserir produto ${produto.name}:`, err.message);
          reject(err);
        } else {
          console.log(`✅ Produto inserido: ${produto.name}`);
          resolve();
        }
      });
    });
  }

  // Inserir clientes
  console.log('👥 Inserindo clientes...');
  const clienteSql = 'INSERT INTO clientes (name, email, phone, street, neighborhood, city, state, zipCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  for (const cliente of clientesIniciais) {
    await new Promise<void>((resolve, reject) => {
      db.run(clienteSql, [cliente.name, cliente.email, cliente.phone, cliente.street, cliente.neighborhood, cliente.city, cliente.state, cliente.zipCode], (err) => {
        if (err) {
          console.error(`Erro ao inserir cliente ${cliente.name}:`, err.message);
          reject(err);
        } else {
          console.log(`✅ Cliente inserido: ${cliente.name}`);
          resolve();
        }
      });
    });
  }

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📊 Dados inseridos:');
  console.log(`   • ${produtosIniciais.length} produtos`);
  console.log(`   • ${clientesIniciais.length} clientes`);
  console.log('');
  console.log('🚀 Agora você pode testar as APIs!');
}

// Executar seed se arquivo for chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Processo de seed finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro durante o seed:', error);
      process.exit(1);
    });
}
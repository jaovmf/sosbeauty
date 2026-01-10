import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../database.db');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
      } else {
        console.log('Conectado ao banco SQLite.');
        this.initTables();
      }
    });
  }

  private initTables(): void {
    this.createClientesTable();
    this.createProdutosTable();
    this.createVendasTable();
    this.createVendaItensTable();
  }

  private createClientesTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        street TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(sql, (err) => {
      if (err) {
        console.error('Erro ao criar tabela clientes:', err.message);
      } else {
        console.log('Tabela clientes criada/verificada com sucesso.');
        this.migrateClientesTable();
      }
    });
  }

  private migrateClientesTable(): void {
    // Verificar se precisa migrar dados antigos
    this.db.get("PRAGMA table_info(clientes)", (err, result) => {
      if (err) return;

      // Verificar se existem colunas antigas
      this.db.all("PRAGMA table_info(clientes)", (err, columns: any[]) => {
        if (err) return;

        const hasOldStructure = columns.some(col => col.name === 'nome');

        if (hasOldStructure) {
          console.log('🔄 Migrando estrutura da tabela clientes...');

          // Criar tabela temporária com nova estrutura
          const createTempSql = `
            CREATE TABLE clientes_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT UNIQUE,
              phone TEXT,
              street TEXT,
              neighborhood TEXT,
              city TEXT,
              state TEXT,
              zipCode TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `;

          this.db.run(createTempSql, (err) => {
            if (err) {
              console.error('Erro ao criar tabela temporária:', err.message);
              return;
            }

            // Migrar dados existentes
            const migrateSql = `
              INSERT INTO clientes_new (id, name, email, phone, street, created_at, updated_at)
              SELECT id, nome, email, telefone, endereco, created_at, updated_at
              FROM clientes
            `;

            this.db.run(migrateSql, (err) => {
              if (err) {
                console.error('Erro ao migrar dados:', err.message);
                return;
              }

              // Remover tabela antiga e renomear nova
              this.db.serialize(() => {
                this.db.run('DROP TABLE clientes');
                this.db.run('ALTER TABLE clientes_new RENAME TO clientes');
                console.log('✅ Migração da tabela clientes concluída!');
              });
            });
          });
        } else {
          // Verificar se precisa adicionar coluna promotional_price em tabelas modernas
          const hasPromotionalPrice = columns.some(col => col.name === 'promotional_price');

          if (!hasPromotionalPrice) {
            console.log('🔄 Adicionando coluna promotional_price na tabela produtos...');
            this.db.run('ALTER TABLE produtos ADD COLUMN promotional_price REAL', (err) => {
              if (err) {
                console.error('Erro ao adicionar coluna promotional_price:', err);
              } else {
                console.log('✅ Coluna promotional_price adicionada com sucesso.');
              }
            });
          }
        }
      });
    });
  }

  private createProdutosTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        description TEXT,
        category TEXT,
        cost REAL,
        price REAL NOT NULL,
        promotional_price REAL,
        stock INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        ativo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(sql, (err) => {
      if (err) {
        console.error('Erro ao criar tabela produtos:', err.message);
      } else {
        console.log('Tabela produtos criada/verificada com sucesso.');
        this.migrateProdutosTable();
      }
    });
  }

  private migrateProdutosTable(): void {
    // Verificar se precisa migrar dados antigos
    this.db.all("PRAGMA table_info(produtos)", (err, columns: any[]) => {
      if (err) return;

      const hasOldStructure = columns.some(col => col.name === 'nome');

      if (hasOldStructure) {
        console.log('🔄 Migrando estrutura da tabela produtos...');

        // Criar tabela temporária com nova estrutura
        const createTempSql = `
          CREATE TABLE produtos_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT,
            description TEXT,
            category TEXT,
            cost REAL,
            price REAL NOT NULL,
            promotional_price REAL,
            stock INTEGER NOT NULL DEFAULT 0,
            image TEXT,
            ativo BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        this.db.run(createTempSql, (err) => {
          if (err) {
            console.error('Erro ao criar tabela temporária produtos:', err.message);
            return;
          }

          // Migrar dados existentes
          const migrateSql = `
            INSERT INTO produtos_new (id, name, description, category, price, stock, ativo, created_at, updated_at)
            SELECT id, nome, descricao, categoria, preco, estoque, ativo, created_at, updated_at
            FROM produtos
          `;

          this.db.run(migrateSql, (err) => {
            if (err) {
              console.error('Erro ao migrar dados de produtos:', err.message);
              return;
            }

            // Remover tabela antiga e renomear nova
            this.db.serialize(() => {
              this.db.run('DROP TABLE produtos');
              this.db.run('ALTER TABLE produtos_new RENAME TO produtos');
              console.log('✅ Migração da tabela produtos concluída!');
            });
          });
        });
      }
    });
  }

  private createVendasTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pendente',
        observacoes TEXT,
        payment_method TEXT,
        shipping_value REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
      )
    `;

    this.db.run(sql, (err) => {
      if (err) {
        console.error('Erro ao criar tabela vendas:', err.message);
      } else {
        console.log('Tabela vendas criada/verificada com sucesso.');
        this.migrateVendasTable();
      }
    });
  }

  private migrateVendasTable(): void {
    // Verificar se a coluna payment_method existe
    this.db.all("PRAGMA table_info(vendas)", (err, columns: any[]) => {
      if (err) {
        console.error('Erro ao verificar estrutura da tabela vendas:', err);
        this.createVendaItensTable();
        return;
      }

      const hasPaymentMethod = columns.some(col => col.name === 'payment_method');
      const hasShippingValue = columns.some(col => col.name === 'shipping_value');

      let needsMigration = false;
      let migrationsCount = 0;
      let completedMigrations = 0;

      if (!hasPaymentMethod) {
        needsMigration = true;
        migrationsCount++;
      }

      if (!hasShippingValue) {
        needsMigration = true;
        migrationsCount++;
      }

      const onMigrationComplete = () => {
        completedMigrations++;
        if (completedMigrations === migrationsCount) {
          this.createVendaItensTable();
        }
      };

      if (!needsMigration) {
        this.createVendaItensTable();
        return;
      }

      if (!hasPaymentMethod) {
        console.log('🔄 Adicionando coluna payment_method na tabela vendas...');
        this.db.run('ALTER TABLE vendas ADD COLUMN payment_method TEXT', (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna payment_method:', err);
          } else {
            console.log('✅ Coluna payment_method adicionada com sucesso.');
          }
          onMigrationComplete();
        });
      }

      if (!hasShippingValue) {
        console.log('🔄 Adicionando coluna shipping_value na tabela vendas...');
        this.db.run('ALTER TABLE vendas ADD COLUMN shipping_value REAL DEFAULT 0', (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna shipping_value:', err);
          } else {
            console.log('✅ Coluna shipping_value adicionada com sucesso.');
          }
          onMigrationComplete();
        });
      }
    });
  }

  private createVendaItensTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS venda_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (venda_id) REFERENCES vendas (id),
        FOREIGN KEY (produto_id) REFERENCES produtos (id)
      )
    `;

    this.db.run(sql, (err) => {
      if (err) {
        console.error('Erro ao criar tabela venda_itens:', err.message);
      } else {
        console.log('Tabela venda_itens criada/verificada com sucesso.');
      }
    });
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Erro ao fechar o banco de dados:', err.message);
      } else {
        console.log('Conexão com o banco de dados fechada.');
      }
    });
  }
}

export const database = new Database();
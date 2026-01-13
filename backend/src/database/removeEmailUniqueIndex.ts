import mongoose from 'mongoose';
import { connectMongoDB } from './mongodb';

/**
 * Script para remover o índice único do campo email na collection clientes
 * Executar uma única vez após atualizar o model
 */

async function removeEmailUniqueIndex() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await connectMongoDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database não conectado');
    }

    console.log('🔍 Verificando índices existentes...');
    const collection = db.collection('clientes');
    const indexes = await collection.indexes();

    console.log('📋 Índices encontrados:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });

    // Procurar índice único do email
    const emailUniqueIndex = indexes.find(
      idx => idx.key.email === 1 && idx.unique === true
    );

    if (emailUniqueIndex && emailUniqueIndex.name) {
      console.log(`\n🗑️  Removendo índice único do email: ${emailUniqueIndex.name}`);
      await collection.dropIndex(emailUniqueIndex.name);
      console.log('✅ Índice único do email removido com sucesso!');
    } else {
      console.log('\n✓  Nenhum índice único do email encontrado');
    }

    console.log('\n📊 Índices após remoção:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Migração concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

removeEmailUniqueIndex();

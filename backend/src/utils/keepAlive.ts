import axios from 'axios';

/**
 * Keep-alive service para evitar que o servidor durma no plano gratuito do Render
 * Faz uma requisição HTTP para o próprio servidor a cada 14 minutos
 */

const PING_INTERVAL = 14 * 60 * 1000; // 14 minutos em milissegundos
const HEALTH_ENDPOINT = '/api/health';

let intervalId: NodeJS.Timeout | null = null;

export const startKeepAlive = (port: number | string) => {
  // Só ativar em produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏸️  Keep-alive desabilitado em desenvolvimento');
    return;
  }

  // URL do próprio servidor
  const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  const pingUrl = `${serverUrl}${HEALTH_ENDPOINT}`;

  console.log('🏓 Keep-alive iniciado');
  console.log(`   URL: ${pingUrl}`);
  console.log(`   Intervalo: ${PING_INTERVAL / 1000 / 60} minutos`);

  // Fazer primeira requisição após 5 minutos (para não pingar logo no início)
  setTimeout(() => {
    pingServer(pingUrl);

    // Depois repetir a cada 14 minutos
    intervalId = setInterval(() => {
      pingServer(pingUrl);
    }, PING_INTERVAL);
  }, 5 * 60 * 1000); // 5 minutos
};

export const stopKeepAlive = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Keep-alive parado');
  }
};

const pingServer = async (url: string) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    if (response.status === 200) {
      console.log('✅ Ping bem-sucedido:', new Date().toISOString());
    }
  } catch (error: any) {
    console.error('❌ Erro no ping:', error.message);
  }
};

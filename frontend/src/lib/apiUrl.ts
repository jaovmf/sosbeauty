// Função para obter URL da API
// Centralizada para evitar duplicação em múltiplos arquivos
export const getApiUrl = (): string => {
  // Se houver variável de ambiente VITE_API_URL, usar ela (produção)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL;
  }

  // Para desenvolvimento, detectar se estamos acessando via IP da rede
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // IPs específicos da rede local
    if (hostname === '192.168.1.7' || hostname === '192.168.1.9') {
      return `http://${hostname}:3003/api`;
    }

    // Qualquer outro IP
    if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      return `http://${hostname}:3003/api`;
    }
  }

  return 'http://localhost:3003/api';
};

// Função para obter URL base do servidor (sem /api) - útil para imagens
export const getServerUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/\/api$/, '');
};

// Função para obter URL da imagem (compatível com Cloudinary e uploads locais)
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '/placeholder-product.jpg';

  // Se já é uma URL completa (Cloudinary ou outra CDN), retornar como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Se é um path relativo (uploads locais antigos), adicionar servidor
  return `${getServerUrl()}${imagePath}`;
};

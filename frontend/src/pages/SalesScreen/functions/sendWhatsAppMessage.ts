import { formatCurrency } from "../../../utils/formatCurrency";

export const sendWhatsAppMessage = (saleData: any) => {
    const clientPhone = saleData.client.phone.replace(/\D/g, '');

    const itemsList = saleData.items.map((item : any) =>
      `• ${item.product.name} - Qtd: ${item.quantity} - ${formatCurrency(item.total)}`
    ).join('\n');

    // Adicionar informações de PIX se necessário
    let pixInfo = '';
    if (saleData.paymentMethod && saleData.paymentMethod.toLowerCase() === 'pix') {
        pixInfo = `

*Dados para Pagamento PIX:*
CNPJ: 46393792000102

Por favor, realize o pagamento e envie o comprovante.`;
    }

    const message = `*Confirmacao de Venda - SOS Beauty*

*Numero da Venda:* ${saleData.saleNumber}
*Data:* ${new Date(saleData.date).toLocaleDateString('pt-BR')} as ${new Date(saleData.date).toLocaleTimeString('pt-BR')}

*Cliente:* ${saleData.client.name}
*Telefone:* ${saleData.client.phone}

*Endereco de Entrega:*
${saleData.client.address.street}
${saleData.client.address.neighborhood}
${saleData.client.address.city} - ${saleData.client.address.state}
CEP: ${saleData.client.address.zipCode}

*Produtos Comprados:*
${itemsList}

*Resumo Financeiro:*
Subtotal: ${formatCurrency(saleData.subtotal)}
Frete: ${saleData.freeShipping ? 'GRATIS' : formatCurrency(saleData.shippingValue)}
*Total Geral: ${formatCurrency(saleData.total)}*${pixInfo}

Obrigado pela sua compra!
Em caso de duvidas, entre em contato conosco.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${clientPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };
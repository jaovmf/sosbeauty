import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Button
} from '@mui/material';
import {
  AddShoppingCart as AddCartIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../contexts/CartContext';
import type { Produto } from '../../types/api';

interface ProductCardProps {
  produto: Produto;
}

const ProductCard: React.FC<ProductCardProps> = ({ produto }) => {
  const { addItem } = useCart();

  const imageUrl = produto.image
    ? `http://localhost:3003${produto.image}`
    : '/placeholder-product.jpg';

  // Calcular desconto percentual se há preço promocional
  const hasPromotion = produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price;
  const discountPercentage = hasPromotion
    ? Math.round(((produto.price - produto.promotional_price!) / produto.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(produto);
  };
  return (
    <Card
      sx={{
        height: { xs: '480px', sm: '500px', md: '520px' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 16px 32px rgba(186, 143, 238, 0.2)',
        },
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(186, 143, 238, 0.1)',
        cursor: 'pointer'
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          src={imageUrl}
          alt={produto.name}
          sx={{
            height: { xs: '200px', sm: '220px', md: '240px' },
            objectFit: 'cover',
            backgroundColor: 'grey.50',
            transition: 'transform 0.3s ease'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDMwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjAgMTAwSDE4MFYxNjBIMTIwVjEwMFoiIGZpbGw9IiNEREREREQiLz4KPHBhdGggZD0iTTEzNSAxMTVIMTY1VjEyNUgxMzVWMTE1WiIgZmlsbD0iI0JCQkJCQiIvPgo8Y2lyY2xlIGN4PSIxNDAiIGN5PSIxMzUiIHI9IjUiIGZpbGw9IiNCQkJCQkIiLz4KPHBhdGggZD0iTTEyNSAxNDVMMTM1IDEzNUwxNDUgMTQ1SDE2NUwxNTUgMTM1TDE3NSAxNTVIMTI1VjE0NVoiIGZpbGw9IiNCQkJCQkIiLz4KPHRleHQgeD0iMTUwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VtIEltYWdlbTwvdGV4dD4KPC9zdmc+';
          }}
        />

        {produto.category && (
          <Chip
            label={produto.category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(186, 143, 238, 0.9)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          />
        )}

        {hasPromotion && (
          <Chip
            label={`-${discountPercentage}%`}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(255, 82, 82, 0.9)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              backdropFilter: 'blur(8px)',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(255, 82, 82, 0.3)'
            }}
          />
        )}

        {produto.stock <= 5 && produto.stock > 0 && !hasPromotion && (
          <Chip
            label="Últimas unidades"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'rgba(255, 87, 34, 0.9)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              backdropFilter: 'blur(8px)',
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {produto.stock <= 5 && produto.stock > 0 && hasPromotion && (
          <Chip
            label="Últimas unidades"
            size="small"
            sx={{
              position: 'absolute',
              top: 60,
              left: 12,
              backgroundColor: 'rgba(255, 87, 34, 0.9)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              backdropFilter: 'blur(8px)',
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {produto.stock === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Paper
              sx={{
                px: 2,
                py: 1,
                backgroundColor: 'error.main'
              }}
            >
              <Typography variant="body2" color="white" fontWeight="bold">
                Esgotado
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: { xs: '1rem', sm: '1.1rem' },
            color: 'text.primary'
          }}
        >
          {produto.name}
        </Typography>

        {produto.brand && (
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            {produto.brand}
          </Typography>
        )}

        {produto.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4
            }}
          >
            {produto.description}
          </Typography>
        )}

        <Box sx={{ mt: 2.5 }}>
          {hasPromotion ? (
            <Box>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary',
                  fontSize: '1rem',
                  mb: 0.5
                }}
              >
                De: {formatCurrency(produto.price)}
              </Typography>
              <Typography
                variant="h5"
                component="div"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.3rem', sm: '1.5rem' },
                  color: '#ff5252'
                }}
              >
                Por: {formatCurrency(produto.promotional_price!)}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.3rem', sm: '1.5rem' },
                background: 'linear-gradient(45deg, #ba8fee 30%, #e1c5ff 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {formatCurrency(produto.price)}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<AddCartIcon />}
            onClick={handleAddToCart}
            disabled={produto.stock === 0}
            sx={{
              mt: 1,
              backgroundColor: '#ba8fee',
              '&:hover': {
                backgroundColor: '#a777e3'
              },
              '&:disabled': {
                backgroundColor: 'grey.300'
              },
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {produto.stock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
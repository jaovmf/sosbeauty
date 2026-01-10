import React from 'react';
import {
  Fab,
  Badge,
  Zoom
} from '@mui/material';
import {
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';

const CartButton: React.FC = () => {
  const { itemCount, openCart } = useCart();

  return (
    <Zoom in={itemCount > 0}>
      <Fab
        color="primary"
        onClick={openCart}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 30 },
          right: { xs: 20, sm: 30 },
          backgroundColor: '#ba8fee',
          '&:hover': {
            backgroundColor: '#a777e3'
          },
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(186, 143, 238, 0.3)'
        }}
      >
        <Badge
          badgeContent={itemCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ff4444',
              color: 'white',
              fontWeight: 'bold'
            }
          }}
        >
          <CartIcon />
        </Badge>
      </Fab>
    </Zoom>
  );
};

export default CartButton;
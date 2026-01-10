import React from 'react';
import { Box, Typography } from '@mui/material';
import logo from "../../../assets/logo.webp";

const CatalogHeader = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      position="relative"
      sx={{
        background: '#ba8feead',
        px: { xs: 2, sm: 3 },
        py: 1,
        minHeight: '80px'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 3,
        }}
      >
        <Box
          component="img"
          src={logo}
          sx={{
            width: { xs: '100px', sm: '120px' },
            height: 'auto',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          alt="SOSBeauty Logo"
        />
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            fontWeight: 500,
            mt: 0.5,
            textAlign: 'center',
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}
        >
          Catálogo de Produtos
        </Typography>
      </Box>
    </Box>
  );
};

export default CatalogHeader;
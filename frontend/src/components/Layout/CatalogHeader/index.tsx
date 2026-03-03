import React from 'react';
import { Box } from '@mui/material';
import logo from "../../../assets/logo.webp";

const CatalogHeader = () => {
  const handleCopyCatalogLink = async () => {
    const catalogUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (!catalogUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(catalogUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = catalogUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {}
  };

  return (
    <Box
      sx={{
        background: '#ba8feead',
        px: { xs: 2, sm: 3 },
        pt: { xs: 1, sm: 1.25 },
        pb: { xs: 1.25, sm: 1.5 },
        minHeight: { xs: 88, sm: 96 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src={logo}
          onClick={handleCopyCatalogLink}
          sx={{
            width: { xs: '90px', sm: '110px' },
            height: 'auto',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          alt="SOSBeauty Logo"
        />
      </Box>
    </Box>
  );
};

export default CatalogHeader;
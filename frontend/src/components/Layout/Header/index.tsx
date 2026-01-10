import logo from "../../../assets/logo.webp"
import { Box, IconButton } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <Box display="flex" alignItems="center" justifyContent={'center'} position="relative" sx={{background : '#ba8feead'}}>
      {!isHomePage && (
        <IconButton
          onClick={handleBackClick}
          sx={{
            position: 'absolute',
            left: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      <Box
        component="img"
        src={logo}
        sx={{
          width: '120px',
          height: 'auto',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}
        onClick={handleLogoClick}
      />
    </Box>
  )
}

export default Header
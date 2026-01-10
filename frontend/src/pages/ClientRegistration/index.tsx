import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useClientes } from '../../hooks/useClientes';
import type { Cliente } from '../../types/api';

  type FormErrors= {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
    
  type FormErrorsKeys = keyof FormErrors;
  
const ClientRegistration = () => {
  const { criarCliente, loading, error: apiError, clearError } = useClientes();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  
  const handleInputChange = (field: FormErrorsKeys, value: string) => {
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatPhone = (value : string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatZipCode = (value : string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const handlePhoneChange = (value : string) => {
    const formatted = formatPhone(value);
    handleInputChange('phone', formatted);
  };

  const handleZipCodeChange = (value : string) => {
    const formatted = formatZipCode(value);
    handleInputChange('zipCode', formatted);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação do email (opcional)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail deve ter um formato válido';
    }

    // Validação do telefone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        newErrors.phone = 'Telefone deve ter 11 dígitos (com DDD)';
      } else if (!phoneDigits.startsWith('11') && !phoneDigits.match(/^[1-9]{2}9/)) {
        newErrors.phone = 'Formato de telefone inválido';
      }
    }

    // Validação do endereço
    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    } else if (formData.street.trim().length < 3) {
      newErrors.street = 'Rua deve ter pelo menos 3 caracteres';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'Cidade deve ter pelo menos 2 caracteres';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    } else if (formData.state.trim().length !== 2) {
      newErrors.state = 'Estado deve ter 2 caracteres (ex: SC)';
    }

    // Validação do CEP
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else {
      const cepDigits = formData.zipCode.replace(/\D/g, '');
      if (cepDigits.length !== 8) {
        newErrors.zipCode = 'CEP deve ter 8 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Limpar erros anteriores
    clearError();

    // Preparar dados para API (seguindo a estrutura do backend)
    const clientData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''), // Remover formatação para salvar
      street: `${formData.street.trim()}, ${formData.number.trim()}`, // Concatenar rua e número
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zipCode: formData.zipCode.replace(/\D/g, '') // Remover formatação para salvar
    };

    try {
      const result = await criarCliente(clientData);

      if (result) {
        console.log('Cliente cadastrado com sucesso:', result);

        // Limpar formulário imediatamente
        handleClear();

        // Mostrar mensagem de sucesso
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      // O erro já é tratado pelo hook useClientes
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
    setErrors({});
    setSuccess(false);
    clearError();
  };

  return (
    <>
      <Container maxWidth="lg">
        <Box padding={{ xs: 2, md: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" marginBottom={{ xs: 2, md: 3 }} sx={{ px: { xs: 1, md: 0 } }}>
            <PersonAddIcon sx={{ marginRight: 1, fontSize: { xs: 24, md: 32 } }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              Cadastrar Novo Cliente
            </Typography>
          </Box>

          {/* Feedback de sucesso */}
          {success && (
            <Alert severity="success" sx={{ marginBottom: { xs: 2, md: 3 }, mx: { xs: 1, md: 0 } }}>
              Cliente cadastrado com sucesso!
            </Alert>
          )}

          {/* Feedback de erro da API */}
          {apiError && (
            <Alert severity="error" sx={{ marginBottom: { xs: 2, md: 3 }, mx: { xs: 1, md: 0 } }}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} {...({} as any)}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: { xs: 2.5, md: 3.5 },
                    mx: { xs: 1, md: 0 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Informações Pessoais
                  </Typography>

                  <Grid container spacing={{ xs: 1.5, md: 3 }}>
                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Nome Completo"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="E-mail (opcional)"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Telefone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        placeholder="(11) 99999-9999"
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: { xs: 2.5, md: 3.5 },
                    mx: { xs: 1, md: 0 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Endereço
                  </Typography>

                  <Grid container spacing={{ xs: 1.5, md: 3 }}>
                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Rua"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        error={!!errors.street}
                        helperText={errors.street}
                        placeholder="Rua das Flores"
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3} md={3} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Número"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        error={!!errors.number}
                        helperText={errors.number}
                        placeholder="270"
                        required
                        sx={{
                          minWidth: '100px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '100px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3} md={3} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="CEP"
                        value={formData.zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        error={!!errors.zipCode}
                        helperText={errors.zipCode}
                        placeholder="12345-678"
                        required
                        sx={{
                          minWidth: '120px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '120px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Bairro"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        error={!!errors.neighborhood}
                        helperText={errors.neighborhood}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Cidade"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        error={!!errors.city}
                        helperText={errors.city}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Estado"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                        error={!!errors.state}
                        helperText={errors.state}
                        placeholder="SC"
                        inputProps={{ maxLength: 2 }}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <Box
                  display="flex"
                  gap={{ xs: 1, md: 2 }}
                  justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                  flexWrap="nowrap"
                  sx={{ px: { xs: 1, md: 0 }, pb: { xs: 2, md: 0 } }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClear}
                    size="large"
                    startIcon={<ClearIcon />}
                    disabled={loading}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      px: { xs: 2, md: 3 },
                      py: { xs: 1, md: 1.5 }
                    }}
                  >
                    Limpar Formulário
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      px: { xs: 2, md: 3 },
                      py: { xs: 1, md: 1.5 }
                    }}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default ClientRegistration;
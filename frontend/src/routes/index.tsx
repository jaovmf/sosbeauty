import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from '../contexts/CartContext';
import AppLayout from '../components/Layout/AppLayout';
import PrivateRoute from '../components/PrivateRoute';
import Login from '../pages/Login';
import Home from '../pages/Home';
import SalesScreen from '../pages/SalesScreen';
import Stock from '../pages/Stock';
import Reports from '../pages/Reports';
import ProductRegistration from '../pages/ProductRegistration';
import ClientRegistration from '../pages/ClientRegistration';
import Catalog from '../pages/Catalog';
import SalesManagement from '../pages/SalesManagement';
import ClientsList from '../pages/ClientsList';
import UsuariosManagement from '../pages/UsuariosManagement';
import FornecedoresList from '../pages/FornecedoresList';
import EntradasMercadoria from '../pages/EntradasMercadoria';

const AppRoutes = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* Rotas protegidas */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/sales" element={<SalesScreen />} />
                    <Route path="/sales-management" element={<SalesManagement />} />
                    <Route path="/stock" element={<Stock />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/products" element={<ProductRegistration />} />
                    <Route path="/clients" element={<ClientRegistration />} />
                    <Route path="/clients-list" element={<ClientsList />} />
                    <Route path="/fornecedores" element={<FornecedoresList />} />
                    <Route path="/entradas" element={<EntradasMercadoria />} />
                    <Route path="/usuarios" element={<UsuariosManagement />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default AppRoutes;
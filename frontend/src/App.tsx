import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 10000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#4caf50',
            },
          },
          error: {
            style: {
              background: '#f44336',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App

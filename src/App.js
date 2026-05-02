import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import Upgrade from './pages/Upgrade';
import PaymentVerify from './pages/PaymentVerify';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlanProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '12px', fontWeight: '500' },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><Orders /></ProtectedRoute>
              } />
              <Route path="/orders/create" element={
                <ProtectedRoute><CreateOrder /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute><OrderDetail /></ProtectedRoute>
              } />
              <Route path="/upgrade" element={
                <ProtectedRoute><Upgrade /></ProtectedRoute>
              } />
              <Route path="/payment/verify" element={
                <ProtectedRoute><PaymentVerify /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PlanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
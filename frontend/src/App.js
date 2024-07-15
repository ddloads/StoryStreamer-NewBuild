import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AudiobookList from './components/AudiobookList';
import AudiobookDetail from './components/AudiobookDetail';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import { CircularProgress, Box } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function PrivateRoute({ children, adminRequired = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  if (adminRequired && !user.isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/audiobooks" element={<AudiobookList />} />
            <Route path="/audiobooks/:id" element={<AudiobookDetail />} />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute adminRequired={true}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
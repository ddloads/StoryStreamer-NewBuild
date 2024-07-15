import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import axios from 'axios';

function AdminDashboard() {
  const [databaseLocation, setDatabaseLocation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddLocation = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/add-database-location', { location: databaseLocation }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      setMessage('');
    }
  };

  const handleScan = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/scan-audiobooks', { location: databaseLocation }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      setMessage('');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      <Box component="form" noValidate autoComplete="off">
        <TextField
          fullWidth
          label="Audiobook Database Location"
          variant="outlined"
          value={databaseLocation}
          onChange={(e) => setDatabaseLocation(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleAddLocation} sx={{ mr: 2 }}>
          Add Location
        </Button>
        <Button variant="contained" color="secondary" onClick={handleScan}>
          Scan Audiobooks
        </Button>
      </Box>
      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Container>
  );
}

export default AdminDashboard;
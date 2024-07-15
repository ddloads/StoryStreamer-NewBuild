import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, List, ListItem, ListItemText, Divider, Button, TextField, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function UserProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setEditedProfile(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', editedProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(editedProfile);
      setEditing(false);
      // Update the user context
      login(editedProfile.email, editedProfile.password);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChange = (e) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

  if (!profile) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {editing ? (
                <Box component="form">
                  <TextField
                    fullWidth
                    margin="normal"
                    name="username"
                    label="Username"
                    value={editedProfile.username}
                    onChange={handleChange}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    name="email"
                    label="Email"
                    value={editedProfile.email}
                    onChange={handleChange}
                  />
                  <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }}>Save</Button>
                </Box>
              ) : (
                <>
                  <Typography variant="h5">{profile.username}</Typography>
                  <Typography color="text.secondary">{profile.email}</Typography>
                  <Button onClick={handleEdit} variant="outlined" sx={{ mt: 2 }}>Edit Profile</Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Listening Stats</Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Total Listening Time" secondary={`${profile.totalListeningTime || 0} minutes`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Completed Books" secondary={profile.completedBooksCount || 0} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Favorite Genre" secondary={profile.favoriteGenre || 'N/A'} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Favorite Audiobooks</Typography>
              <List>
                {profile.favoriteAudiobooks && profile.favoriteAudiobooks.map((book, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={book.title} secondary={book.author} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Listens</Typography>
              <List>
                {profile.listeningHistory && profile.listeningHistory.slice(0, 5).map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={item.audiobook.title} 
                      secondary={`Last listened: ${new Date(item.lastListenedAt).toLocaleDateString()}`} 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UserProfile;
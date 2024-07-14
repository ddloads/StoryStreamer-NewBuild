import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, List, ListItem, ListItemText, Divider } from '@mui/material';
import axios from 'axios';

function UserProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // TODO: Add authorization token to request
        const response = await axios.get('http://localhost:5000/api/users/profile');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>
      <Card>
        <CardContent>
          <Typography variant="h5">{profile.username}</Typography>
          <Typography color="text.secondary">{profile.email}</Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Listening Stats</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Total Listening Time" secondary={`${profile.totalListeningTime} minutes`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Completed Books" secondary={profile.completedBooksCount} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Favorite Genre" secondary={profile.mostListenedGenre} />
              </ListItem>
            </List>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="h6">Recent Listens</Typography>
            <List>
              {profile.listeningHistory.slice(0, 5).map((item, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={item.audiobook.title} 
                    secondary={`Last listened: ${new Date(item.lastListenedAt).toLocaleDateString()}`} 
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default UserProfile;
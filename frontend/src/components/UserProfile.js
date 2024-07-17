import React from 'react';
import { Container, Typography, Box, Card, CardContent, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function UserProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Typography>You must be logged in to view this page.</Typography>;
  }

  // Calculate total listening time
  const totalListeningTime = user.listeningHistory.reduce((total, item) => total + item.progress, 0);
  
  // Find most listened genre
  const genreCounts = user.listeningHistory.reduce((counts, item) => {
    counts[item.audiobook.genre] = (counts[item.audiobook.genre] || 0) + 1;
    return counts;
  }, {});
  const mostListenedGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>
      <Card>
        <CardContent>
          <Typography variant="h5">{user.username}</Typography>
          <Typography color="text.secondary">{user.email}</Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Listening Stats</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Total Listening Time" secondary={`${Math.round(totalListeningTime / 60)} minutes`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Completed Books" secondary={user.completedBooks.length} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Favorite Genre" secondary={mostListenedGenre} />
              </ListItem>
            </List>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="h6">Recent Listens</Typography>
            <List>
              {user.listeningHistory.slice(0, 5).map((item, index) => (
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
import React from 'react';
import { Typography, Container, Box } from '@mui/material';

function Home() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to StoryStreamer
        </Typography>
        <Typography variant="body1">
          Discover and enjoy your favorite audiobooks with StoryStreamer.
        </Typography>
      </Box>
    </Container>
  );
}

export default Home;
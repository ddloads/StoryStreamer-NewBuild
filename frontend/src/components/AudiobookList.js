import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Button } from '@mui/material';
import axios from 'axios';

function AudiobookList() {
  const [audiobooks, setAudiobooks] = useState([]);

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/audiobooks');
        setAudiobooks(response.data);
      } catch (error) {
        console.error('Error fetching audiobooks:', error);
      }
    };

    fetchAudiobooks();
  }, []);

  return (
    <Container sx={{ py: 8 }} maxWidth="md">
      <Grid container spacing={4}>
        {audiobooks.map((audiobook) => (
          <Grid item key={audiobook._id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                sx={{ pt: '56.25%' }}
                image={audiobook.coverImageUrl}
                alt={audiobook.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {audiobook.title}
                </Typography>
                <Typography>
                  {audiobook.authors.join(', ')}
                </Typography>
              </CardContent>
              <Button component={Link} to={`/audiobooks/${audiobook._id}`} size="small" color="primary">
                View Details
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default AudiobookList;
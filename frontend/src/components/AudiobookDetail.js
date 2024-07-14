import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Card, CardMedia, CardContent, Button } from '@mui/material';
import axios from 'axios';

function AudiobookDetail() {
  const [audiobook, setAudiobook] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchAudiobook = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/audiobooks/${id}`);
        setAudiobook(response.data);
      } catch (error) {
        console.error('Error fetching audiobook details:', error);
      }
    };

    fetchAudiobook();
  }, [id]);

  if (!audiobook) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardMedia
          component="img"
          height="400"
          image={audiobook.coverImageUrl}
          alt={audiobook.title}
        />
        <CardContent>
          <Typography gutterBottom variant="h4" component="h1">
            {audiobook.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            By {audiobook.authors.join(', ')}
          </Typography>
          <Typography variant="body1" paragraph>
            {audiobook.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Narrator: {audiobook.narrator}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {audiobook.duration} minutes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Genre: {audiobook.genre}
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }}>
            Start Listening
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default AudiobookDetail;
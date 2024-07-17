import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Button } from '@mui/material';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

function AudiobookList() {
  const [audiobooks, setAudiobooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudiobooks = async () => {
      try {
        const db = getFirestore();
        const audiobooksCollection = collection(db, 'audiobooks');
        const audiobooksSnapshot = await getDocs(audiobooksCollection);
        const audiobooksList = audiobooksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAudiobooks(audiobooksList);
      } catch (error) {
        console.error('Error fetching audiobooks:', error);
        setError('Failed to fetch audiobooks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudiobooks();
  }, []);

  if (loading) {
    return <Typography>Loading audiobooks...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container sx={{ py: 8 }} maxWidth="md">
      <Grid container spacing={4}>
        {audiobooks.map((audiobook) => (
          <Grid item key={audiobook.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                sx={{ pt: '56.25%' }}
                image={audiobook.coverImageUrl || 'https://via.placeholder.com/150'}
                alt={audiobook.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {audiobook.title}
                </Typography>
                <Typography>
                  {audiobook.authors ? audiobook.authors.join(', ') : 'Unknown Author'}
                </Typography>
              </CardContent>
              <Button component={Link} to={`/audiobooks/${audiobook.id}`} size="small" color="primary">
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
import { useEffect, useState } from 'react'
import { Container, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { getPlaylists, type Playlist } from '../api/playlists'
import PlaylistCard from '../components/PlaylistCard'

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPlaylists().then(setPlaylists).catch(() => setError('Failed to load playlists'))
  }, [])

  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>RAGE Playlists</Heading>
      {error && <Text color="red.500">{error}</Text>}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {playlists.map(p => <PlaylistCard key={p.id} playlist={p} />)}
      </SimpleGrid>
    </Container>
  )
}

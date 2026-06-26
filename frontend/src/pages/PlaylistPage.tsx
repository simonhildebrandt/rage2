import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Container, Heading, Text, VStack, Button } from '@chakra-ui/react'
import { getPlaylist, type PlaylistWithVideos } from '../api/playlists'
import VideoRow from '../components/VideoRow'

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const [playlist, setPlaylist] = useState<PlaylistWithVideos | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) getPlaylist(Number(id)).then(setPlaylist).catch(() => setError('Failed to load playlist'))
  }, [id])

  if (error) return <Container py={8}><Text color="red.500">{error}</Text></Container>
  if (!playlist) return null

  return (
    <Container maxW="container.md" py={8}>
      <Button as={Link} to="/" variant="link" mb={4}>← Back</Button>
      <Heading mb={1}>{playlist.title}</Heading>
      <Text color="gray.500">{playlist.aired_date}</Text>
      <Text fontSize="sm" mb={6}>
        <a href={playlist.source_url} target="_blank" rel="noopener noreferrer">View on ABC</a>
      </Text>
      <VStack align="stretch" divider={<hr />} spacing={0}>
        {playlist.videos.map(v => <VideoRow key={v.id} video={v} />)}
      </VStack>
    </Container>
  )
}

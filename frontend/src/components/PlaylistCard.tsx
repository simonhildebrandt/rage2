import { Box, Text, LinkBox, LinkOverlay } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import type { Playlist } from '../api/playlists'

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <LinkBox as="article" borderWidth="1px" borderRadius="md" p={4}>
      <Text fontSize="sm" color="gray.500">{playlist.aired_date}</Text>
      <LinkOverlay as={Link} to={`/playlist/${playlist.id}`}>
        <Text fontWeight="bold">{playlist.title}</Text>
      </LinkOverlay>
    </LinkBox>
  )
}

import { Flex, Text, Image, Box } from '@chakra-ui/react'
import type { Video } from '../api/playlists'

const YOUTUBE_BASE = 'https://www.youtube.com/watch?v='

export default function VideoRow({ video }: { video: Video }) {
  const youtubeUrl = video.youtube_id ? `${YOUTUBE_BASE}${video.youtube_id}` : null

  return (
    <Flex gap={3} align="center" py={2}>
      {video.thumbnail
        ? <a href={youtubeUrl ?? undefined} target="_blank" rel="noopener noreferrer">
            <Image src={video.thumbnail} alt={video.title} boxSize="60px" objectFit="cover" borderRadius="sm" />
          </a>
        : <Box boxSize="60px" bg="gray.100" borderRadius="sm" />
      }
      <Box>
        <Text fontWeight="medium">{video.title}</Text>
        <Text fontSize="sm" color="gray.500">{video.artist}</Text>
        {video.youtube_id && (
          <Text fontSize="xs" color="blue.400">
            <a href={youtubeUrl!} target="_blank" rel="noopener noreferrer">{video.youtube_id}</a>
          </Text>
        )}
      </Box>
      <Text ml="auto" fontSize="sm" color="gray.400">#{video.position} · id:{video.id}</Text>
    </Flex>
  )
}

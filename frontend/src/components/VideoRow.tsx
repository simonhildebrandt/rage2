import { Flex, Text, Image, Box } from '@chakra-ui/react'
import type { Video } from '../api/playlists'

export default function VideoRow({ video }: { video: Video }) {
  return (
    <Flex gap={3} align="center" py={2}>
      {video.thumbnail && (
        <Image src={video.thumbnail} alt={video.title} boxSize="60px" objectFit="cover" borderRadius="sm" />
      )}
      <Box>
        <Text fontWeight="medium">{video.title}</Text>
        <Text fontSize="sm" color="gray.500">{video.artist}</Text>
      </Box>
      <Text ml="auto" fontSize="sm" color="gray.400">#{video.position}</Text>
    </Flex>
  )
}

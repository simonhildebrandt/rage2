import { useState } from 'react'
import { Container, Heading, Button, Text, VStack } from '@chakra-ui/react'
import { api } from '../api/client'
import { useAuth } from '../providers/AuthProvider'

export default function AdminPage() {
  const { logout } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const triggerScrape = async () => {
    setLoading(true)
    setStatus(null)
    try {
      await api.post('/api/admin/scrape')
      setStatus('Scrape triggered successfully.')
    } catch {
      setStatus('Scrape failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container py={8}>
      <Heading mb={6}>Admin</Heading>
      <VStack align="start" spacing={4}>
        <Button onClick={triggerScrape} isLoading={loading} colorScheme="blue">
          Trigger Scrape
        </Button>
        {status && <Text>{status}</Text>}
        <Button variant="ghost" onClick={logout}>Sign out</Button>
      </VStack>
    </Container>
  )
}

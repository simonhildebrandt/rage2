import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Text } from '@chakra-ui/react'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      login(token)
      navigate('/admin', { replace: true })
    }
  }, [])

  return (
    <Container py={8}>
      <Text>Signing in…</Text>
    </Container>
  )
}

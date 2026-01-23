import { useSearchParams } from 'react-router-dom'
import LoginForm from '../features/auth/LoginForm'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  return <LoginForm redirect={redirect} />
}


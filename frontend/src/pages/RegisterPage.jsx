import { useSearchParams } from 'react-router-dom'
import RegisterForm from '../features/auth/RegisterForm'
import DoctorRegisterForm from '../features/auth/DoctorRegisterForm'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')

  // Default to SaaS/Doctor registration for gynsys.net entry point
  if (type === 'patient' || type === 'cycle') {
    return <RegisterForm />
  }

  return <DoctorRegisterForm />
}


import { useSearchParams } from 'react-router-dom'
import RegisterForm from '../features/auth/RegisterForm'
import DoctorRegisterForm from '../features/auth/DoctorRegisterForm'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type')

  if (type === 'doctor') {
    return <DoctorRegisterForm />
  }

  return <RegisterForm />
}


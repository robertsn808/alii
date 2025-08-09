import { StaffPaymentApp } from '@/components/staff/StaffPaymentApp'

export default function StaffPage() {
  return <StaffPaymentApp />
}

export const metadata = {
  title: 'Staff Terminal - Ali\'i Fish Market',
  description: 'Mobile payment terminal for Ali\'i Fish Market staff',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
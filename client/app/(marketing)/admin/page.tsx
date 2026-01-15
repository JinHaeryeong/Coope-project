import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import NoticeWrite from '../_components/notices/notice-write'

export default async function AdminDashboard() {
  // Protect the page from users who are not admins
  const isAdmin = await checkRole('admin')
  if (!isAdmin) {
    redirect('/')
  }

  return <NoticeWrite />
}

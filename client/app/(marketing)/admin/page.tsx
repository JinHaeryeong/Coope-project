import { checkRole } from '@/utils/roles'
import { redirect } from 'next/navigation'
import NoticeWrite from '../_components/noticeWrite'

export default async function AdminDashboard() {
  // Protect the page from users who are not admins
  const isAdmin = await checkRole('admin')
  if (!isAdmin) {
    redirect('/')
  }

  return <NoticeWrite />
}


// convex quickstarting 문서에 있는 관리자 대시보드 리팩토링 부분 당장은 필요x, 오류도 나기때문에 우선 주석처리
/*
import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { SearchUsers } from './SearchUsers'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from './_actions'

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>
}) {
  if (!checkRole('admin')) {
    redirect('/')
  }

  const query = (await params.searchParams).search

  const client = await clerkClient()

  const users = query ? (await client.users.getUserList({ query })).data : []

  return (
    <>
      <p>This is the protected admin dashboard restricted to users with the `admin` role.</p>

      <SearchUsers />

      {users.map((user) => {
        return (
          <div key={user.id}>
            <div>
              {user.firstName} {user.lastName}
            </div>

            <div>
              {
                user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
                  ?.emailAddress
              }
            </div>

            <div>{user.publicMetadata.role as string}</div>

            <form action={setRole}>
              <input type="hidden" value={user.id} name="id" />
              <input type="hidden" value="admin" name="role" />
              <button type="submit">Make Admin</button>
            </form>

            <form action={setRole}>
              <input type="hidden" value={user.id} name="id" />
              <input type="hidden" value="moderator" name="role" />
              <button type="submit">Make Moderator</button>
            </form>

            <form action={removeRole}>
              <input type="hidden" value={user.id} name="id" />
              <button type="submit">Remove Role</button>
            </form>
          </div>
        )
      })}
    </>
  )
}
*/

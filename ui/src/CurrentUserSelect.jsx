import { useEffect, useState } from 'react'
import { Select } from '@mantine/core'
import { usersApi } from './api'

// Lets you choose which user you are acting as. The chosen user's saved theme
// is loaded on selection, and theme changes are saved to that user's record.
export default function CurrentUserSelect({ value, onChange }) {
  const [users, setUsers] = useState([])

  const load = async () => {
    try {
      setUsers(await usersApi.list())
    } catch (e) {
      console.error('Failed to load users', e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Select
      placeholder="Acting as (no user)"
      clearable
      w={240}
      data={users.map((u) => ({ value: u.id, label: u.name }))}
      value={value}
      onChange={onChange}
      onDropdownOpen={load}
    />
  )
}

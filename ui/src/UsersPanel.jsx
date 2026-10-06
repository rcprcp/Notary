import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Group, Modal, PasswordInput, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { usersApi } from './api'

const EMPTY_FORM = { name: '', email: '', password: '', passwordConfirm: '' }

export default function UsersPanel() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)
  const [opened, setOpened] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list())
      setError(null)
    } catch (e) {
      setError(`Failed to load users: ${e.message}`)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setOpened(true)
  }

  const openEdit = (user) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, password: '', passwordConfirm: '' })
    setOpened(true)
  }

  const save = async () => {
    const isEdit = editingId !== null
    if (!form.name.trim() || !form.email.trim() || (!isEdit && !form.password)) {
      setError(isEdit ? 'Name and email are required' : 'Name, email and password are required')
      return
    }
    // If password is provided, confirm it matches
    if (form.password && form.password !== form.passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        // Only send the password if the user typed a new one.
        const body = { name: form.name, email: form.email }
        if (form.password) body.password = form.password
        await usersApi.update(editingId, body)
      } else {
        await usersApi.create({ name: form.name, email: form.email, password: form.password })
      }
      setOpened(false)
      setError(null)
      await load()
    } catch (e) {
      setError(`Failed to save user: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? Their notes will be deleted too.`)) return
    try {
      await usersApi.remove(user.id)
      setError(null)
      await load()
    } catch (e) {
      setError(`Failed to delete user: ${e.message}`)
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Users</Title>
        <Group>
          <Button variant="default" onClick={load}>Refresh</Button>
          <Button onClick={openCreate}>New user</Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <Text c="dimmed">No users yet. Create one to get started.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>ID</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Updated</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td><Text size="xs" ff="monospace">{u.id}</Text></Table.Td>
                <Table.Td>{new Date(u.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(u.updatedAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => openEdit(u)}>Edit</Button>
                    <Button size="xs" variant="light" color="red" onClick={() => remove(u)}>Delete</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title={editingId ? 'Edit user' : 'New user'}>
        <Stack>
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <PasswordInput
            label={editingId ? 'New password (leave blank to keep current)' : 'Password'}
            required={!editingId}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.currentTarget.value })}
          />
          <PasswordInput
            label={editingId ? 'Confirm new password' : 'Confirm password'}
            required={form.password !== ''}
            value={form.passwordConfirm}
            onChange={(e) => setForm({ ...form, passwordConfirm: e.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editingId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

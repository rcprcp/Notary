import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Group, Modal, Select, Stack, Table, Text, Textarea, Title } from '@mantine/core'
import { notesApi, usersApi } from './api'

const EMPTY_FORM = { ownerId: null, content: '' }

function preview(text, max = 80) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function NotesPanel() {
  const [notes, setNotes] = useState([])
  const [users, setUsers] = useState([])
  const [filterOwner, setFilterOwner] = useState(null)
  const [error, setError] = useState(null)
  const [opened, setOpened] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
    [users],
  )
  const userNames = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u.name])), [users])

  const load = useCallback(async () => {
    try {
      const [u, n] = await Promise.all([usersApi.list(), notesApi.list(filterOwner)])
      setUsers(u)
      setNotes(n)
      setError(null)
    } catch (e) {
      setError(`Failed to load notes: ${e.message}`)
    }
  }, [filterOwner])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ownerId: filterOwner, content: '' })
    setOpened(true)
  }

  const openEdit = (note) => {
    setEditingId(note.id)
    setForm({ ownerId: note.ownerId, content: note.content })
    setOpened(true)
  }

  const save = async () => {
    if (!form.ownerId) {
      setError('Please choose an owner')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await notesApi.update(editingId, { content: form.content })
      } else {
        await notesApi.create({ ownerId: form.ownerId, content: form.content })
      }
      setOpened(false)
      setError(null)
      await load()
    } catch (e) {
      setError(`Failed to save note: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (note) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await notesApi.remove(note.id)
      setError(null)
      await load()
    } catch (e) {
      setError(`Failed to delete note: ${e.message}`)
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Notes</Title>
        <Group>
          <Select
            placeholder="All owners"
            clearable
            data={userOptions}
            value={filterOwner}
            onChange={setFilterOwner}
            w={260}
          />
          <Button variant="default" onClick={load}>Refresh</Button>
          <Button onClick={openCreate} disabled={users.length === 0}>New note</Button>
        </Group>
      </Group>

      {users.length === 0 && (
        <Alert color="yellow">Create a user first; every note needs an owner.</Alert>
      )}

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {notes.length === 0 ? (
        <Text c="dimmed">No notes found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Content</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Updated</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notes.map((n) => (
              <Table.Tr key={n.id}>
                <Table.Td>{userNames[n.ownerId] ?? <Text size="xs" ff="monospace">{n.ownerId}</Text>}</Table.Td>
                <Table.Td>{preview(n.content)}</Table.Td>
                <Table.Td>{new Date(n.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(n.updatedAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => openEdit(n)}>Edit</Button>
                    <Button size="xs" variant="light" color="red" onClick={() => remove(n)}>Delete</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editingId ? 'Edit note' : 'New note'}
        size="lg"
      >
        <Stack>
          <Select
            label="Owner"
            required
            data={userOptions}
            value={form.ownerId}
            onChange={(v) => setForm({ ...form, ownerId: v })}
            disabled={editingId !== null}
            description={editingId ? 'The owner of an existing note cannot be changed' : undefined}
          />
          <Textarea
            label="Content"
            autosize
            minRows={6}
            maxRows={20}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.currentTarget.value })}
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

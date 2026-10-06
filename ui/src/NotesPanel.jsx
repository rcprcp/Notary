import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Group, Modal, Select, Stack, Table, Text, Textarea, Title, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import { notesApi, usersApi } from './api'

function preview(text, max = 80) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

// Clickable, sortable column header.
function SortableTh({ label, field, sort, onSort }) {
  const active = sort.field === field
  const Icon = !active ? IconSelector : sort.dir === 'asc' ? IconChevronUp : IconChevronDown
  return (
    <Table.Th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <UnstyledButton onClick={() => onSort(field)}>
        <Group gap={4} wrap="nowrap">
          <Text fw={600} size="sm">{label}</Text>
          <Icon size={14} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}

// Notes of one user (selected by UUID), newest first by default.
// `currentUserId` is the "Acting as" user from the header; it is the default owner.
export default function NotesPanel({ currentUserId }) {
  const [notes, setNotes] = useState([])
  const [users, setUsers] = useState([])
  const [ownerId, setOwnerId] = useState(currentUserId ?? null)
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' })
  const [error, setError] = useState(null)
  const [opened, setOpened] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Follow the header's "Acting as" user.
  useEffect(() => {
    setOwnerId(currentUserId ?? null)
  }, [currentUserId])

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
    [users],
  )

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list())
      // Only ever fetch the selected user's notes, by UUID.
      setNotes(ownerId ? await notesApi.list(ownerId) : [])
      setError(null)
    } catch (e) {
      setError(`Failed to load notes: ${e.message}`)
    }
  }, [ownerId])

  useEffect(() => {
    load()
  }, [load])

  const toggleSort = (field) =>
    setSort((s) =>
      s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: field === 'content' ? 'asc' : 'desc' },
    )

  const sortedNotes = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1
    const value = (n) => {
      if (sort.field === 'content') return (n.content || '').toLowerCase()
      return new Date(n[sort.field]).getTime()
    }
    return [...notes].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      return x < y ? -factor : x > y ? factor : 0
    })
  }, [notes, sort])

  const openCreate = () => {
    setEditingId(null)
    setContent('')
    setOpened(true)
  }

  const openEdit = (note) => {
    setEditingId(note.id)
    setContent(note.content)
    setOpened(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editingId) {
        await notesApi.update(editingId, { content })
      } else {
        await notesApi.create({ ownerId, content })
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
            placeholder="Select a user"
            data={userOptions}
            value={ownerId}
            onChange={setOwnerId}
            w={260}
          />
          <Button variant="default" onClick={load} disabled={!ownerId}>Refresh</Button>
          <Button onClick={openCreate} disabled={!ownerId}>New note</Button>
        </Group>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!ownerId ? (
        <Text c="dimmed">Select a user to see their notes.</Text>
      ) : sortedNotes.length === 0 ? (
        <Text c="dimmed">This user has no notes yet.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <SortableTh label="Content" field="content" sort={sort} onSort={toggleSort} />
              <SortableTh label="Created" field="createdAt" sort={sort} onSort={toggleSort} />
              <SortableTh label="Updated" field="updatedAt" sort={sort} onSort={toggleSort} />
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedNotes.map((n) => (
              <Table.Tr key={n.id}>
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
          <Textarea
            label="Content"
            autosize
            minRows={6}
            maxRows={20}
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
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

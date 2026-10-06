import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Group, Modal, Select, Stack, Table, Text, TextInput, Textarea, Title, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import { notesApi, usersApi } from './api'

const EMPTY_FORM = { title: '', content: '' }

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

const TEXT_FIELDS = ['title', 'content']

// Notes of one user (selected by UUID), newest first by default.
// `currentUserId` is the "Acting as" user from the header; it is the default owner.
export default function NotesPanel({ currentUserId }) {
  const [notes, setNotes] = useState([])
  const [users, setUsers] = useState([])
  const [ownerId, setOwnerId] = useState(currentUserId ?? null)
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' })
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [opened, setOpened] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
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
      s.field === field
        ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: TEXT_FIELDS.includes(field) ? 'asc' : 'desc' },
    )

  const sortedNotes = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1
    const value = (n) =>
      TEXT_FIELDS.includes(sort.field)
        ? (n[sort.field] || '').toLowerCase()
        : new Date(n[sort.field]).getTime()
    return [...notes].sort((a, b) => {
      const x = value(a)
      const y = value(b)
      return x < y ? -factor : x > y ? factor : 0
    })
  }, [notes, sort])

  const openCreate = () => {
    setEditingNote(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setOpened(true)
  }

  // Selecting a note shows both its title and content for editing.
  const openEdit = (note) => {
    setEditingNote(note)
    setForm({ title: note.title || '', content: note.content || '' })
    setFormError(null)
    setOpened(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setFormError('Title is required')
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      if (editingNote) {
        // Send only the fields that were modified.
        const body = {}
        if (form.title.trim() !== (editingNote.title || '')) body.title = form.title.trim()
        if (form.content !== editingNote.content) body.content = form.content
        if (Object.keys(body).length > 0) {
          await notesApi.update(editingNote.id, body)
        }
      } else {
        await notesApi.create({ ownerId, title: form.title.trim(), content: form.content })
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
    if (!window.confirm(`Delete note "${note.title || 'Untitled'}"?`)) return
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
              <SortableTh label="Title" field="title" sort={sort} onSort={toggleSort} />
              <SortableTh label="Content" field="content" sort={sort} onSort={toggleSort} />
              <SortableTh label="Created" field="createdAt" sort={sort} onSort={toggleSort} />
              <SortableTh label="Updated" field="updatedAt" sort={sort} onSort={toggleSort} />
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedNotes.map((n) => (
              <Table.Tr key={n.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(n)}>
                <Table.Td>{n.title || <Text c="dimmed" fs="italic">Untitled</Text>}</Table.Td>
                <Table.Td>{preview(n.content)}</Table.Td>
                <Table.Td>{new Date(n.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(n.updatedAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={(e) => { e.stopPropagation(); openEdit(n) }}>Edit</Button>
                    <Button size="xs" variant="light" color="red" onClick={(e) => { e.stopPropagation(); remove(n) }}>Delete</Button>
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
        title={editingNote ? 'Edit note' : 'New note'}
        size="lg"
      >
        <Stack>
          <TextInput
            label="Title"
            required
            maxLength={255}
            value={form.title}
            error={formError}
            onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
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
            <Button onClick={save} loading={saving}>{editingNote ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

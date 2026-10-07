import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Checkbox, Group, List, Modal, Stack, Table, Text, TextInput, Title, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconSearch, IconSelector } from '@tabler/icons-react'
import { RichTextEditor } from '@mantine/tiptap'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/extension-markdown'
import { notesApi } from './api'

const EMPTY_FORM = { title: '', content: '' }
const DEFAULT_SEARCH = { q: '', searchTitles: true, searchContent: true }

function MarkdownEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Write your note here...',
      }),
      Markdown,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown ? editor.storage.markdown.getMarkdown() : editor.getText()
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        spellcheck: 'true',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const nextMarkdown = value || ''
    const currentMarkdown = editor.storage.markdown?.getMarkdown ? editor.storage.markdown.getMarkdown() : editor.getText()
    if (currentMarkdown !== nextMarkdown) {
      editor.commands.setContent(nextMarkdown, { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Toolbar sticky stickyOffset={60}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Blockquote />
          <RichTextEditor.Code />
          <RichTextEditor.CodeBlock />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  )
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

const TEXT_FIELDS = ['title']

// Notes of the authenticated user. No owner selection needed.
export default function NotesPanel() {
  const [notes, setNotes] = useState([])
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' })
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [opened, setOpened] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Search form state (what the user is typing/selecting)
  const [search, setSearch] = useState(DEFAULT_SEARCH)
  // Search that is currently applied to the list (null = no active search)
  const [activeSearch, setActiveSearch] = useState(null)
  const [helpOpened, setHelpOpened] = useState(false)

  const load = useCallback(async (searchParams) => {
    try {
      setNotes(await notesApi.list(searchParams))
      setError(null)
    } catch (e) {
      if (e.status === 401) {
        setError('Session expired. Please login again.')
      } else {
        setError(`Failed to load notes: ${e.message}`)
      }
    }
  }, [])

  useEffect(() => {
    load(activeSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const reload = () => load(activeSearch)

  const runSearch = async () => {
    if (!search.q.trim()) {
      // Empty search text: clear the search and show all notes.
      setActiveSearch(null)
      await load(null)
      return
    }
    if (!search.searchTitles && !search.searchContent) {
      setHelpOpened(true)
      return
    }
    setActiveSearch(search)
    await load(search)
  }

  const clearSearch = async () => {
    setSearch(DEFAULT_SEARCH)
    setActiveSearch(null)
    await load(null)
  }

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
        await notesApi.create({ title: form.title.trim(), content: form.content })
      }
      setOpened(false)
      setError(null)
      await reload()
    } catch (e) {
      if (e.status === 401) {
        setError('Session expired. Please login again.')
      } else {
        setError(`Failed to save note: ${e.message}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (note) => {
    if (!window.confirm(`Delete note "${note.title || 'Untitled'}"?`)) return
    try {
      await notesApi.remove(note.id)
      setError(null)
      await reload()
    } catch (e) {
      if (e.status === 401) {
        setError('Session expired. Please login again.')
      } else {
        setError(`Failed to delete note: ${e.message}`)
      }
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Notes</Title>
        <Group>
          <Button variant="default" onClick={reload}>Refresh</Button>
          <Button onClick={openCreate}>New note</Button>
        </Group>
      </Group>

      <Stack gap="xs">
        <Group align="flex-end" wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            placeholder="Search notes..."
            leftSection={<IconSearch size={16} />}
            value={search.q}
            onChange={(e) => setSearch({ ...search, q: e.currentTarget.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
          />
          <Button onClick={runSearch}>Search</Button>
          <Button variant="default" onClick={clearSearch} disabled={!activeSearch && !search.q}>
            Clear
          </Button>
        </Group>
        <Group gap="lg">
          <Checkbox
            label="Search Titles"
            checked={search.searchTitles}
            onChange={(e) => setSearch({ ...search, searchTitles: e.currentTarget.checked })}
          />
          <Checkbox
            label="Search Note Content"
            checked={search.searchContent}
            onChange={(e) => setSearch({ ...search, searchContent: e.currentTarget.checked })}
          />
        </Group>
      </Stack>

      {activeSearch && (
        <Text size="sm" c="dimmed">
          {notes.length} result{notes.length === 1 ? '' : 's'} for "{activeSearch.q.trim()}"
        </Text>
      )}

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {notes.length === 0 ? (
        <Text c="dimmed">{activeSearch ? 'No notes match your search.' : 'You have no notes yet.'}</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <SortableTh label="Created" field="createdAt" sort={sort} onSort={toggleSort} />
              <SortableTh label="Updated" field="updatedAt" sort={sort} onSort={toggleSort} />
              <SortableTh label="Title" field="title" sort={sort} onSort={toggleSort} />
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedNotes.map((n) => (
              <Table.Tr key={n.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(n)}>
                <Table.Td>{new Date(n.createdAt).toLocaleString()}</Table.Td>
                <Table.Td>{new Date(n.updatedAt).toLocaleString()}</Table.Td>
                <Table.Td>{n.title || <Text c="dimmed" fs="italic">Untitled</Text>}</Table.Td>
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

          <div>
            <Text fw={500} size="sm" mb={6}>Content</Text>
            <MarkdownEditor
              value={form.content}
              onChange={(value) => setForm((current) => ({ ...current, content: value }))}
            />
          </div>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editingNote ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={helpOpened}
        onClose={() => setHelpOpened(false)}
        title="How to search your notes"
      >
        <Stack>
          <Text>
            Choose where to look before searching. Please check at least one of the boxes:
          </Text>
          <List spacing="xs">
            <List.Item><b>Search Titles</b> &ndash; match words in note titles.</List.Item>
            <List.Item><b>Search Note Content</b> &ndash; match words in the body of your notes.</List.Item>
          </List>
          <Text>
            Check both to search titles and content together. Then type your search words and
            press <b>Search</b> (or Enter).
          </Text>
          <Text size="sm" c="dimmed">
            Search is word-based and ignores case, common words (like "the"), and word endings
            (for example, "running" also matches "run"). All of your words must appear in the
            same field. Clear the search box and press Search, or press Clear, to see all notes again.
          </Text>
          <Group justify="flex-end">
            <Button onClick={() => setHelpOpened(false)}>Got it</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

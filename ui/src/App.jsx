import { useState, useEffect } from 'react'
import { Container, Title, Button, TextInput, Textarea, Card, Group, Stack, Modal, Badge } from '@mantine/core'
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'

function App() {
  const [notes, setNotes] = useState([])
  const [opened, setOpened] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  })

  // Fetch all notes on component mount
  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleOpenModal = () => {
    setIsEditing(false)
    setFormData({ title: '', content: '', author: '' })
    setOpened(true)
  }

  const handleEditNote = (note) => {
    setIsEditing(true)
    setEditingId(note.id)
    setFormData({
      title: note.title,
      content: note.content || '',
      author: note.author || ''
    })
    setOpened(true)
  }

  const handleSaveNote = async () => {
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    const url = isEditing ? `/api/notes/${editingId}` : '/api/notes'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setOpened(false)
        fetchNotes()
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchNotes()
        }
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    }
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>📝 Notary</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenModal}
          >
            New Note
          </Button>
        </Group>

        {notes.length === 0 ? (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <p>No notes yet. Create your first note!</p>
          </Card>
        ) : (
          <Stack gap="md">
            {notes.map((note) => (
              <Card key={note.id} shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Title order={3}>{note.title}</Title>
                      {note.author && <Badge>{note.author}</Badge>}
                    </div>
                    <Group gap="xs">
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => handleEditNote(note)}
                        leftSection={<IconEdit size={14} />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => handleDeleteNote(note.id)}
                        leftSection={<IconTrash size={14} />}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Group>
                  {note.content && <p>{note.content}</p>}
                  <small>{new Date(note.updatedAt).toLocaleString()}</small>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={isEditing ? 'Edit Note' : 'Create New Note'}
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Enter note title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
            required
          />
          <Textarea
            label="Content"
            placeholder="Enter note content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.currentTarget.value })}
            rows={6}
          />
          <TextInput
            label="Author"
            placeholder="Enter author name"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.currentTarget.value })}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}

export default App
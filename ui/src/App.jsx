import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Button, Container, Group, Title } from '@mantine/core'
import UsersPanel from './UsersPanel'
import NotesPanel from './NotesPanel'
import OpenApiButton from './OpenApiButton'
import ThemeButton from './ThemeButton'
import CurrentUserSelect from './CurrentUserSelect'

const PAGES = [
  { path: '/users', label: 'Users' },
  { path: '/notes', label: 'Notes' },
]

// Single-page app shell: the header/nav stay mounted; only the routed view is
// swapped in place on navigation, with no full page reloads.
function App({ themeColor, onThemeChange, currentUserId, onUserChange }) {
  const { pathname } = useLocation()

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Notary</Title>
        <Group gap="sm">
          <CurrentUserSelect value={currentUserId} onChange={onUserChange} />
          <ThemeButton value={themeColor} onThemeChange={onThemeChange} />
          <OpenApiButton />
        </Group>
      </Group>

      <Group mb="md" component="nav">
        {PAGES.map((p) => (
          <Button
            key={p.path}
            component={Link}
            to={p.path}
            variant={pathname.startsWith(p.path) ? 'filled' : 'light'}
          >
            {p.label}
          </Button>
        ))}
      </Group>

      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UsersPanel />} />
        <Route path="/notes" element={<NotesPanel currentUserId={currentUserId} />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </Container>
  )
}

export default App

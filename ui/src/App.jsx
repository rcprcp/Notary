import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Button, Container, Group, Title } from '@mantine/core'
import UsersPanel from './UsersPanel'
import NotesPanel from './NotesPanel'
import OpenApiButton from './OpenApiButton'

const PAGES = [
  { path: '/users', label: 'Users', element: <UsersPanel /> },
  { path: '/notes', label: 'Notes', element: <NotesPanel /> },
]

// Single-page app shell: the header/nav stay mounted; only the routed view is
// swapped in place on navigation, with no full page reloads.
function App() {
  const { pathname } = useLocation()

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Notary</Title>
        <OpenApiButton />
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
        {PAGES.map((p) => (
          <Route key={p.path} path={p.path} element={p.element} />
        ))}
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </Container>
  )
}

export default App

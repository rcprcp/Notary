import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Container, Group, Button, Stack, Title } from '@mantine/core'
import LoginPage from './LoginPage'
import NotesPanel from './NotesPanel'
import ThemeButton from './ThemeButton'

export default function App({ themeColor, onThemeChange, currentUser, onLogin, onLogout }) {
  if (!currentUser) {
    return <LoginPage onLogin={onLogin} />
  }

  return (
    <Stack gap={0} style={{ minHeight: '100vh' }}>
      <Box component="header" h={60} p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="space-between" align="center">
          <Title order={1}>NoteArray</Title>
          <Group>
            <ThemeButton value={themeColor} onThemeChange={onThemeChange} />
            <Button variant="light" onClick={onLogout}>Logout</Button>
          </Group>
        </Group>
      </Box>

      <Container size="lg" my="md" style={{ flex: 1 }}>
        <Routes>
          <Route path="/notes" element={<NotesPanel />} />
          <Route path="*" element={<Navigate to="/notes" />} />
        </Routes>
      </Container>
    </Stack>
  )
}

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Box, Container, Group, Button, Stack, Title } from '@mantine/core'
import { IconNote } from '@tabler/icons-react'
import LoginPage from './LoginPage'
import NotesPanel from './NotesPanel'
import UserMenu from './UserMenu'

export default function App({ themeColor, onThemeChange, currentUser, onLogin, onLogout }) {
  const navigate = useNavigate()

  if (!currentUser) {
    return <LoginPage onLogin={onLogin} />
  }

  return (
    <Stack gap={0} style={{ minHeight: '100vh' }}>
      <Box component="header" p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Title
              order={1}
              size="h3"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/notes')}
            >
              NoteArray
            </Title>
            <Button
              variant="subtle"
              leftSection={<IconNote size={16} />}
              onClick={() => navigate('/notes')}
            >
              Notes
            </Button>
          </Group>

          <UserMenu
            user={currentUser}
            themeColor={themeColor}
            onThemeChange={onThemeChange}
            onLogout={onLogout}
          />
        </Group>
      </Box>

      <Container size="lg" my="md" style={{ flex: 1 }}>
        <Routes>
          <Route path="/notes" element={<NotesPanel />} />
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </Container>
    </Stack>
  )
}
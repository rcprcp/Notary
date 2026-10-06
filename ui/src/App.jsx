import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Container, Group, Button, Stack, Header, Title } from '@mantine/core'
import LoginPage from './LoginPage'
import NotesPanel from './NotesPanel'
import ThemeButton from './ThemeButton'

export default function App({ themeColor, onThemeChange, currentUser, onLogin, onLogout }) {
  if (!currentUser) {
    return <LoginPage onLogin={onLogin} />
  }

  return (
    <Stack gap={0} style={{ minHeight: '100vh' }}>
      <Header height={60} withBorder p="md">
        <Group justify="space-between">
          <Title order={1}>Notary</Title>
          <Group>
            <ThemeButton value={themeColor} onThemeChange={onThemeChange} />
            <Button variant="light" onClick={onLogout}>Logout</Button>
          </Group>
        </Group>
      </Header>

      <Container size="lg" my="md" style={{ flex: 1 }}>
        <Routes>
          <Route path="/notes" element={<NotesPanel />} />
          <Route path="*" element={<Navigate to="/notes" />} />
        </Routes>
      </Container>
    </Stack>
  )
}

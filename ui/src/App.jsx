import { Container, Group, Tabs, Title } from '@mantine/core'
import UsersPanel from './UsersPanel'
import NotesPanel from './NotesPanel'
import OpenApiButton from './OpenApiButton'

function App() {
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Notary</Title>
        <OpenApiButton />
      </Group>
      <Tabs defaultValue="users" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="users">Users</Tabs.Tab>
          <Tabs.Tab value="notes">Notes</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="users">
          <UsersPanel />
        </Tabs.Panel>
        <Tabs.Panel value="notes">
          <NotesPanel />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}

export default App

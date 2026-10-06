import { Container, Tabs, Title } from '@mantine/core'
import UsersPanel from './UsersPanel'
import NotesPanel from './NotesPanel'

function App() {
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="lg">Notary</Title>
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

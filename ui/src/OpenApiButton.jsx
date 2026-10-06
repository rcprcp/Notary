import { useState } from 'react'
import { Alert, Button, Code, Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'

// Button that fetches the OpenAPI description from the Quarkus SmallRye endpoint
// and shows it in a modal. Also links to the interactive Swagger UI.
export default function OpenApiButton() {
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const [spec, setSpec] = useState(null)
  const [error, setError] = useState(null)

  const openAndLoad = async () => {
    setOpened(true)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/q/openapi?format=json')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      setSpec(JSON.stringify(json, null, 2))
    } catch (e) {
      setError(`Failed to load OpenAPI description: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={openAndLoad}>API description</Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="OpenAPI description"
        size="xl"
      >
        <Stack>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Source: /q/openapi</Text>
            <Group gap="xs">
              <Button size="xs" variant="default" onClick={openAndLoad}>Reload</Button>
              <Button
                size="xs"
                component="a"
                href="/q/swagger-ui"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Swagger UI
              </Button>
            </Group>
          </Group>

          {loading && <Loader size="sm" />}
          {error && <Alert color="red">{error}</Alert>}
          {spec && !loading && (
            <ScrollArea h={500}>
              <Code block>{spec}</Code>
            </ScrollArea>
          )}
        </Stack>
      </Modal>
    </>
  )
}

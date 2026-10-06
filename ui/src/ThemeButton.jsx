import { useState } from 'react'
import { Button, Modal, SimpleGrid } from '@mantine/core'

const THEME_COLORS = [
  'dark', 'gray', 'red', 'pink', 'grape', 'violet', 'indigo',
  'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange',
]

// `value` is the active color; `onThemeChange` persists/applies a new one.
export default function ThemeButton({ value, onThemeChange }) {
  const [opened, setOpened] = useState(false)

  const select = (color) => {
    onThemeChange(color)
    setOpened(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>Theme</Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Select color theme">
        <SimpleGrid cols={3} spacing="sm">
          {THEME_COLORS.map((color) => (
            <Button
              key={color}
              color={color}
              variant={value === color ? 'filled' : 'light'}
              onClick={() => select(color)}
              styles={{ root: { textTransform: 'capitalize' } }}
            >
              {color}
            </Button>
          ))}
        </SimpleGrid>
      </Modal>
    </>
  )
}

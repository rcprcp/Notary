import { useState } from 'react'
import { Button, Group, Modal, SimpleGrid } from '@mantine/core'
import { MANTINE_COLORS } from '@mantine/core'

const THEME_COLORS = [
  'blue',
  'cyan',
  'grape',
  'gray',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'teal',
  'violet',
  'yellow',
  'dark',
]

export default function ThemeButton({ onThemeChange }) {
  const [opened, setOpened] = useState(false)
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('notary-theme-color') || 'blue'
  })

  const handleSelectTheme = (color) => {
    setActiveTheme(color)
    localStorage.setItem('notary-theme-color', color)
    onThemeChange(color)
    setOpened(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpened(true)}>Theme</Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Select color theme">
        <SimpleGrid cols={4} gap="md">
          {THEME_COLORS.map((color) => {
            const colorValue = MANTINE_COLORS[color]?.[6] || '#000000'
            return (
              <Button
                key={color}
                onClick={() => handleSelectTheme(color)}
                variant={activeTheme === color ? 'filled' : 'light'}
                color={color}
                fullWidth
                styles={{ root: { textTransform: 'capitalize' } }}
              >
                {color}
              </Button>
            )
          })}
        </SimpleGrid>
      </Modal>
    </>
  )
}

import { useState } from 'react'
import { Avatar, Badge, Group, Menu, Modal, Table, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconLogout, IconPalette, IconUser } from '@tabler/icons-react'
import { ThemePicker } from './ThemeButton'

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

// Top-right personal settings menu: shows the signed-in user and lets them
// view every field of their user record and change their theme.
export default function UserMenu({ user, themeColor, onThemeChange, onLogout }) {
  const [profileOpened, setProfileOpened] = useState(false)
  const [themeOpened, setThemeOpened] = useState(false)

  return (
    <>
      <Menu shadow="md" width={240} position="bottom-end">
        <Menu.Target>
          <UnstyledButton aria-label="Personal settings">
            <Group gap="xs" wrap="nowrap">
              <Avatar radius="xl" color={themeColor} size="sm">{initials(user.name)}</Avatar>
              <Text fw={500} visibleFrom="sm">{user.name}</Text>
              <IconChevronDown size={14} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Signed in as</Menu.Label>
          <Menu.Item leftSection={<IconUser size={16} />} disabled>
            {user.email}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item leftSection={<IconUser size={16} />} onClick={() => setProfileOpened(true)}>
            My profile
          </Menu.Item>
          <Menu.Item leftSection={<IconPalette size={16} />} onClick={() => setThemeOpened(true)}>
            Theme
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={onLogout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal opened={profileOpened} onClose={() => setProfileOpened(false)} title="My profile" size="md">
        <Table verticalSpacing="xs" withTableBorder>
          <Table.Tbody>
            <ProfileRow label="Name" value={user.name} />
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow label="Theme" value={<Badge color={themeColor}>{user.themeColor}</Badge>} />
            <ProfileRow label="Last login" value={formatDate(user.lastLogin)} />
            <ProfileRow label="Created" value={formatDate(user.createdAt)} />
            <ProfileRow label="Updated" value={formatDate(user.updatedAt)} />
            <ProfileRow label="ID" value={<Text size="xs" ff="monospace">{user.id}</Text>} />
          </Table.Tbody>
        </Table>
      </Modal>

      <ThemePicker
        opened={themeOpened}
        onClose={() => setThemeOpened(false)}
        value={themeColor}
        onThemeChange={onThemeChange}
      />
    </>
  )
}

function ProfileRow({ label, value }) {
  return (
    <Table.Tr>
      <Table.Td w={120} fw={500}>{label}</Table.Td>
      <Table.Td>{value}</Table.Td>
    </Table.Tr>
  )
}
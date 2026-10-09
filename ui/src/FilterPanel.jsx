import { useState } from 'react'
import { Badge, Button, Card, Group, MultiSelect, Stack, Text, TextInput } from '@mantine/core'

export const DEFAULT_FILTERS = {
  tags: [],
  collection: null,
}

export function buildApiFilters(f) {
  const out = { tags: f.tags || [] }
  if (f.collection === 'untagged') out.untagged = true
  if (f.collection === 'pinned') out.pinned = true
  return out
}

export function describeFilters(f) {
  const items = []
  ;(f.tags || []).forEach((t) => items.push({ key: `tag:${t}`, label: `Tag: ${t}`, clear: { tags: (f.tags || []).filter((x) => x !== t) } }))
  if (f.collection === 'pinned') items.push({ key: 'collection', label: 'Pinned', clear: { collection: null } })
  if (f.collection === 'untagged') items.push({ key: 'collection', label: 'Untagged', clear: { collection: null } })
  return items
}

export function TagMultiSelect({ tags, value, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim().toLowerCase()
    if (!v) return
    const parts = v.split(/\s+/).filter(Boolean)
    const next = [...(value || [])]
    parts.forEach((p) => {
      if (!next.includes(p)) next.push(p)
    })
    onChange(next)
    setInput('')
  }
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">Tags</Text>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="Enter tag(s)"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <Button onClick={add}>Add</Button>
      </Group>
      <MultiSelect
        data={(tags || []).concat((value || []).filter((t) => !(tags || []).includes(t)))}
        value={value || []}
        onChange={onChange}
        searchable
        clearable
        nothingFoundMessage="No tags"
      />
    </Stack>
  )
}

export default function FilterPanel({ filters, onChange, allTags }) {
  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <TagMultiSelect tags={allTags} value={filters.tags || []} onChange={(tags) => onChange({ tags })} />
      </Stack>
    </Card>
  )
}

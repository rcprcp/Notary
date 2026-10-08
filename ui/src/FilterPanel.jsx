import { useState } from 'react'
import { ActionIcon, Badge, Button, Card, Group, MultiSelect, SegmentedControl, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconPin, IconX } from '@tabler/icons-react'

export const DEFAULT_FILTERS = {
  dateField: 'updatedAt', // 'createdAt' | 'updatedAt'
  datePreset: null, // null | '7' | '30' | 'custom'
  dateFrom: '', // yyyy-mm-dd (custom range)
  dateTo: '',
  tags: [],
  collection: null, // null | 'untagged' | 'pinned' | 'today' | 'stale'
}

export const STALE_DAYS = 30

export const COLLECTIONS = [
  { value: 'untagged', label: 'Untagged' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'today', label: 'Modified today' },
  { value: 'stale', label: `Oldest unmodified (${STALE_DAYS}+ days)` },
]

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const daysAgo = (n) => {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - n)
  return d
}
// Parse yyyy-mm-dd as a local date (null if invalid).
const parseLocalDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

// Convert UI filter state into API query filters.
export function buildApiFilters(f) {
  const out = { tags: f.tags }
  const prefix = f.dateField === 'createdAt' ? 'created' : 'updated'
  let from = null
  let to = null
  if (f.datePreset === '7' || f.datePreset === '30') {
    from = daysAgo(Number(f.datePreset))
  } else if (f.datePreset === 'custom') {
    from = parseLocalDate(f.dateFrom)
    const end = parseLocalDate(f.dateTo)
    if (end) to = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
  }
  if (from) out[`${prefix}From`] = from.toISOString()
  if (to) out[`${prefix}To`] = to.toISOString()
  if (f.collection === 'untagged') out.untagged = true
  if (f.collection === 'pinned') out.pinned = true
  if (f.collection === 'today') out.updatedFrom = startOfDay(new Date()).toISOString()
  if (f.collection === 'stale') out.updatedTo = daysAgo(STALE_DAYS).toISOString()
  return out
}

// Human readable list of the active filters, each with a way to clear it.
export function describeFilters(f) {
  const items = []
  const field = f.dateField === 'createdAt' ? 'Created' : 'Modified'
  if (f.datePreset === '7' || f.datePreset === '30') {
    items.push({ key: 'date', label: `${field}: last ${f.datePreset} days`, clear: { datePreset: null, dateFrom: '', dateTo: '' } })
  } else if (f.datePreset === 'custom' && (f.dateFrom || f.dateTo)) {
    items.push({ key: 'date', label: `${field}: ${f.dateFrom || '…'} to ${f.dateTo || '…'}`, clear: { datePreset: null, dateFrom: '', dateTo: '' } })
  }
  f.tags.forEach((t) => items.push({ key: `tag:${t}`, label: `Tag: ${t}`, clear: { tags: f.tags.filter((x) => x !== t) } }))
  if (f.collection) {
    const c = COLLECTIONS.find((x) => x.value === f.collection)
    items.push({ key: 'collection', label: c ? c.label : f.collection, clear: { collection: null } })
  }
  return items
}

// Removable pill for one active filter.
export function FilterBadge({ label, onClear }) {
  return (
    <Badge
      variant="filled"
      size="lg"
      rightSection={
        <ActionIcon size="xs" variant="transparent" color="white" onClick={onClear} aria-label={`Clear filter ${label}`}>
          <IconX size={12} />
        </ActionIcon>
      }
      style={{ textTransform: 'none' }}
    >
      {label}
    </Badge>
  )
}

export function DateRangePickerInput({ from, to, onChange }) {
  return (
    <Group grow gap="xs" align="flex-end">
      <TextInput
        type="date"
        label="From"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ dateFrom: e.currentTarget.value })}
      />
      <TextInput
        type="date"
        label="To"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ dateTo: e.currentTarget.value })}
      />
    </Group>
  )
}

export function TagMultiSelect({ tags, value, onChange }) {
  return (
    <MultiSelect
      label="Tags (note must have all)"
      placeholder={value.length ? undefined : 'Select tags'}
      data={tags}
      value={value}
      onChange={onChange}
      searchable
      clearable
      nothingFoundMessage="No tags"
    />
  )
}

export function SmartCollections({ active, counts, onSelect }) {
  return (
    <Stack gap={4}>
      <Text fw={600} size="sm">Smart collections</Text>
      {COLLECTIONS.map((c) => (
        <UnstyledButton
          key={c.value}
          onClick={() => onSelect(active === c.value ? null : c.value)}
          aria-pressed={active === c.value}
          style={{ minHeight: 44, padding: '0 8px', borderRadius: 4, background: active === c.value ? 'var(--mantine-primary-color-light)' : undefined }}
        >
          <Group justify="space-between" wrap="nowrap" mih={44}>
            <Group gap={6} wrap="nowrap">
              {c.value === 'pinned' && <IconPin size={14} />}
              <Text size="sm" fw={active === c.value ? 600 : 400}>{c.label}</Text>
            </Group>
            <Badge variant="light" size="sm">{counts[c.value] ?? 0}</Badge>
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  )
}

export function SavedSearches({ saved, canSave, onSave, onApply, onDelete }) {
  const [name, setName] = useState('')
  const submit = () => {
    if (!name.trim()) return
    onSave(name.trim())
    setName('')
  }
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">Saved searches</Text>
      <Group gap="xs" wrap="nowrap" align="flex-end">
        <TextInput
          style={{ flex: 1 }}
          placeholder="Name this search"
          aria-label="Saved search name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        />
        <Button onClick={submit} disabled={!name.trim() || !canSave}>Save</Button>
      </Group>
      {saved.length === 0 && <Text size="xs" c="dimmed">No saved searches yet.</Text>}
      {saved.map((s) => (
        <Group key={s.id} justify="space-between" wrap="nowrap" gap="xs">
          <UnstyledButton onClick={() => onApply(s)} style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center' }}>
            <Text size="sm" truncate>{s.name}</Text>
          </UnstyledButton>
          <ActionIcon variant="subtle" color="red" size="lg" onClick={() => onDelete(s.id)} aria-label={`Delete saved search ${s.name}`}>
            <IconX size={16} />
          </ActionIcon>
        </Group>
      ))}
    </Stack>
  )
}

// Filter sidebar content: date range, tags, smart collections and saved searches.
export default function FilterPanel({ filters, onChange, allTags, collectionCounts, saved, canSave, onSaveSearch, onApplySaved, onDeleteSaved }) {
  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <Stack gap="xs">
          <Text fw={600} size="sm">Date</Text>
          <SegmentedControl
            size="xs"
            fullWidth
            value={filters.dateField}
            onChange={(v) => onChange({ dateField: v })}
            data={[{ value: 'updatedAt', label: 'Modified' }, { value: 'createdAt', label: 'Created' }]}
          />
          <SegmentedControl
            size="xs"
            fullWidth
            value={filters.datePreset || 'any'}
            onChange={(v) => onChange({ datePreset: v === 'any' ? null : v })}
            data={[
              { value: 'any', label: 'Any' },
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {filters.datePreset === 'custom' && (
            <DateRangePickerInput from={filters.dateFrom} to={filters.dateTo} onChange={onChange} />
          )}
        </Stack>
        <TagMultiSelect tags={allTags} value={filters.tags} onChange={(tags) => onChange({ tags })} />
        <SmartCollections active={filters.collection} counts={collectionCounts} onSelect={(collection) => onChange({ collection })} />
        <SavedSearches saved={saved} canSave={canSave} onSave={onSaveSearch} onApply={onApplySaved} onDelete={onDeleteSaved} />
      </Stack>
    </Card>
  )
}

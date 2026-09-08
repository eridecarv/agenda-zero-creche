import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Chip } from './Chip'

const meta: Meta<typeof Chip> = {
  title: 'Primitivos/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
    },
    dot: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Chip>

export const Category: Story = {
  args: { label: 'Alimentação', variant: 'primary', dot: true },
}

export const Status: Story = {
  args: { label: 'Completo', variant: 'success' },
}

export const FilterActive: Story = {
  args: { label: 'Hoje', active: true },
}

export const FilterInactive: Story = {
  args: { label: 'Esta semana', active: false },
}

export const AllStates: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Chip label="Alimentação" variant="primary" dot />
        <Chip label="Sono" variant="success" dot />
        <Chip label="Fraldas" variant="warning" dot />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Chip label="Completo" variant="success" />
        <Chip label="Pendente" variant="warning" />
        <Chip label="Atenção" variant="danger" />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Chip label="Hoje" active />
        <Chip label="Esta semana" active={false} />
      </div>
    </div>
  ),
}

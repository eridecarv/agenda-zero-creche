import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Primitivos/Badge',
  component: Badge,
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
type Story = StoryObj<typeof Badge>

export const Primary: Story = {
  args: { label: 'Maternal I', variant: 'primary' },
}

export const Success: Story = {
  args: { label: 'Turma Girassol', variant: 'success' },
}

export const Warning: Story = {
  args: { label: 'Fraldas', variant: 'warning', dot: true },
}

export const Danger: Story = {
  args: { label: 'Atenção', variant: 'danger' },
}

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Badge label="Primary" variant="primary" />
      <Badge label="Success" variant="success" />
      <Badge label="Warning" variant="warning" dot />
      <Badge label="Danger" variant="danger" />
    </div>
  ),
}

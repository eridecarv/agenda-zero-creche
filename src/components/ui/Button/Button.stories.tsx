import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Primitivos/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'pill'],
    },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    fullWidth: false,
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Registrar',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Adicionar',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancelar',
  },
}

export const Pill: Story = {
  args: {
    variant: 'pill',
    children: '+ Foto',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Salvar',
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Registrar',
    loading: true,
  },
}

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    children: 'Registrar',
    fullWidth: true,
  },
}

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Button variant="primary">Registrar</Button>
      <Button variant="secondary">Adicionar</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="pill">+ Foto</Button>
      <Button variant="primary" disabled>
        Salvar
      </Button>
    </div>
  ),
}

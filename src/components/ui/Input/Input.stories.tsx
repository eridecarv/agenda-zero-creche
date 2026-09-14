import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within } from 'storybook/test'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Primitivos/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'Nome da criança',
    placeholder: 'Digite o nome completo',
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Empty: Story = {
  args: {},
}

export const Default: Story = {
  args: {
    defaultValue: 'Lara Mendes',
  },
}

export const Focus: Story = {
  args: {
    defaultValue: 'Lara Mendes',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Nome da criança')
    input.focus()
  },
}

export const Error: Story = {
  args: {
    label: 'Email',
    type: 'email',
    defaultValue: 'maria@gmail',
    error: 'Email inválido. Verifique e tente novamente.',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Matrícula',
    placeholder: 'Gerado automaticamente',
    disabled: true,
  },
}

export const AllStates: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
      <Input label="Nome da criança" defaultValue="Lara Mendes" />
      <Input
        label="Email"
        type="email"
        defaultValue="maria@gmail"
        error="Email inválido. Verifique e tente novamente."
      />
      <Input label="Matrícula" placeholder="Gerado automaticamente" disabled />
    </div>
  ),
}

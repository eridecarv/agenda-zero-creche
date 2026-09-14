import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Primitivos/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    padding: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: <p className="text-fg1">Conteúdo do card.</p>,
  },
}

export const Clickable: Story = {
  args: {
    children: <p className="text-fg1">Passe o mouse e clique para ver os estados.</p>,
    onClick: () => alert('Card clicado'),
  },
}

export const PaddingSmall: Story = {
  args: {
    padding: 'sm',
    children: <p className="text-fg1">Padding pequeno (p-3).</p>,
  },
}

export const PaddingLarge: Story = {
  args: {
    padding: 'lg',
    children: <p className="text-fg1">Padding grande (p-5).</p>,
  },
}

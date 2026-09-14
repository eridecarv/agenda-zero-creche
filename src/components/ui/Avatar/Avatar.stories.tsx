import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Primitivos/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    name: 'Lara Mendes',
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {},
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const CustomEmoji: Story = {
  args: { emoji: '🧒' },
}

export const WithPhoto: Story = {
  args: {
    photo: 'https://images.unsplash.com/photo-1503457574465-1e9dd9e7b1c1?w=200&h=200&fit=crop',
  },
}

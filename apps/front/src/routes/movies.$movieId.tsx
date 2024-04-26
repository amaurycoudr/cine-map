import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/movies/$movieId')({
  component: () => <div>Hello /movies/$movieId!</div>
})
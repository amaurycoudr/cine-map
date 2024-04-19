import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => (
    <div>
      Hello /!
      <Link to="/createMap">On construction</Link>
    </div>
  ),
});

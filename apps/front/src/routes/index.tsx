import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => (
    <div>
      Hello /!
      <Link to="/createMap" search={{ q: '' }}>
        On construction
      </Link>
    </div>
  ),
});

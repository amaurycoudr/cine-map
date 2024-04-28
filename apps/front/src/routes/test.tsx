import { client, queryClient } from '@/client';
import MovieThumbnail from '@/components/ui/movie-thumbnail';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

const moviesQueryOptions = queryOptions({
  queryKey: ['movies'],
  queryFn: async () => {
    const data = await client.getMovies();
    if (data.status !== 200) throw 'error';
    return data;
  },
  enabled: false,
});

export const Route = createFileRoute('/test')({
  loader: async () => {
    const response = await client.getMovies();

    if (response.status !== 200) throw 'error';
    queryClient.setQueryData(moviesQueryOptions.queryKey, response);
  },
  component: () => <Components />,
});

const Components = () => {
  const { data: moviesData } = useSuspenseQuery(moviesQueryOptions);
  return (
    <>
      <div className="container flex max-w-6xl flex-row flex-wrap justify-around gap-x-8 gap-y-6 py-8">
        {moviesData.body.map((props) => {
          return <MovieThumbnail key={props.id} {...props} />;
        })}
      </div>
    </>
  );
};

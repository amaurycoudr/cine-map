import { client, queryClient } from '@/client';
import AllocineRatings from '@/components/ui/allocine-ratings';
import SquareLink from '@/components/ui/square-link';
import { getWhereToWatchGoogleLink } from '@/utils/google';
import { getDirectors, getPersonsName } from '@/utils/person';
import { pipe } from '@/utils/pipe';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { TvIcon } from 'lucide-react';

const movieQuery = (id: string) =>
  queryOptions({
    queryFn: async () => {
      const data = await client.getMovie({ params: { id } });
      if (data.status !== 200) throw 'error';
      return data;
    },
    queryKey: ['movie', id],
  });

export const Route = createFileRoute('/movies/$movieId')({
  loader: async ({ params: { movieId } }) => {
    const data = await client.getMovie({ params: { id: movieId } });

    if (data.status === 200) queryClient.setQueryData(movieQuery(movieId).queryKey, data);
    else throw 'failed';
  },
  component: () => <Component />,
});

const Component = () => {
  const { movieId } = Route.useParams();
  const {
    data: { body },
  } = useSuspenseQuery(movieQuery(movieId));
  const { backdrop, title, poster, crew, releaseDate, allocineRatings } = body;
  const directors = pipe(crew, getDirectors, getPersonsName);

  return (
    <div className="min-h-sv">
      <div className="relative flex h-[70svh] w-full flex-col">
        {backdrop ? (
          <img className="bg-primary absolute -z-10 h-full w-full object-cover" src={backdrop} />
        ) : (
          <div className="bg-primary absolute -z-10 h-full w-full" />
        )}
        <div className="from-background absolute bottom-0 -z-10 h-[70svh] w-full bg-gradient-to-t" />

        <div className="absolute -bottom-48 left-0 right-0 ml-auto mr-auto flex max-w-6xl items-center  gap-8">
          <img src={poster} className="h-96 w-64 rounded-lg object-cover shadow-lg dark:border-2" alt={title} />
          <div className="flex flex-col">
            <h1 className="text-pretty text-6xl font-black">{title}</h1>
            <h2 className="mt-4 text-4xl font-black">
              <span className="font-normal">de</span> {directors}{' '}
              <span className="text-muted-foreground font-normal">({dayjs(releaseDate).year()})</span>
            </h2>
            <div className="mt-8 flex gap-4">
              <AllocineRatings {...allocineRatings} className="self-start" />
              <SquareLink
                icon={<TvIcon />}
                text="Regarder"
                className="flex-none"
                variant="secondary"
                target="_blank"
                rel="noreferrer"
                href={getWhereToWatchGoogleLink(title, directors)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-48" />
    </div>
  );
};

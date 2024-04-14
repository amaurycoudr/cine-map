import { capitalizeFirstLetter } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Typography from '@/components/ui/typography';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDebounce } from '@uidotdev/usehooks';
import dayjs from 'dayjs';
import { useState } from 'react';
import { z } from 'zod';
import { client } from '../client';

export const Route = createFileRoute('/createMap')({
  component: () => <Component />,
  validateSearch: (search) =>
    z
      .object({
        q: z.string(),
      })
      .optional()
      .default({ q: '' })
      .parse(search),
});

const useDebounceState = <T,>(initialValue: T, delay = 300) => {
  const [state, setState] = useState<T>(initialValue);
  const debounceState = useDebounce(state, delay);
  return { state, debounceState, setState };
};

const Component = () => {
  const { q } = Route.useSearch();
  const { state: qState, debounceState: debouncedQState, setState: setQState } = useDebounceState(q);
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['tmdb-search', debouncedQState],
    queryFn: () => client.searchTmdb({ query: { q: debouncedQState } }),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  const { mutate, status, variables } = useMutation({
    mutationFn: (id: number) => client.postTmdbMovie({ params: { id: `${id}` } }),
  });

  if (data?.status !== 200) return;

  return (
    <div className="p-12 w-full  gap-8  flex flex-col ">
      <Typography variant={'h1'} className="self-center">
        Création d'une carte
      </Typography>
      <Typography variant={'h2'}> 1. Le titre</Typography>
      <Input
        onChange={({ target: { value } }) => {
          setQState(value);
          navigate({ search: { q: debouncedQState } });
        }}
        value={capitalizeFirstLetter(qState)}
        placeholder="Harry ..."
      />
      <Typography variant={'h2'}> 2. Les films</Typography>
      <Input
        onChange={({ target: { value } }) => {
          setQState(value);
          navigate({ search: { q: debouncedQState } });
        }}
        value={capitalizeFirstLetter(qState)}
        placeholder="Harry ..."
      />

      {data.body
        .filter(({ posterPath }) => !!posterPath)
        .map(({ title, id, posterPath, releaseDate, overview }) => {
          return (
            <Card key={id} className="max-w-2xl">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{dayjs(releaseDate).format('DD/MM/YYYY')}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-6 flex-row">
                <img
                  alt={title}
                  className="object-contain h-48 rounded-md shadow-lg  aspect-[2/3] "
                  src={`https://image.tmdb.org/t/p/original/${posterPath}`}
                />
                <div className="flex flex-col justify-around">
                  <CardDescription>
                    <span className="line-clamp-6">{overview}</span>
                  </CardDescription>
                  <Button className="self-end w-32" disabled={status === 'pending' && id === variables} onClick={() => mutate(id)}>
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};

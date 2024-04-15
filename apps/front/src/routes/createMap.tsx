import { capitalizeFirstLetter } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Typography from '@/components/ui/typography';
import { keepPreviousData, queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDebounce } from '@uidotdev/usehooks';
import dayjs from 'dayjs';
import { DependencyList, EffectCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { client, queryClient } from '../client';
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons';

const mapQueryOptions = (id: number | undefined) =>
  queryOptions({
    queryKey: ['map', id],
    queryFn: async () => {
      const data = await client.getMap({ params: { id: id! } });
      if (data.status !== 200) throw 'Invalid id';
      return data;
    },
    enabled: !!id,
  });

export const Route = createFileRoute('/createMap')({
  component: () => <Component />,

  validateSearch: (search) => z.object({ q: z.string(), id: z.number().optional() }).optional().default({ q: '' }).parse(search),
  loaderDeps: ({ search: { id } }) => {
    return { id };
  },
  loader: async ({ deps: { id } }) => {
    const existingMap = id ? await client.getMap({ params: { id } }) : undefined;
    if (existingMap && existingMap.status === 200) {
      queryClient.setQueryData(mapQueryOptions(id).queryKey, existingMap);
      return { id };
    }

    const newMap = await client.createMap();
    if (newMap.status === 201) {
      queryClient.setQueryData(mapQueryOptions(newMap.body.id).queryKey, { ...newMap, status: 200 });
      return { id: newMap.body.id };
    }
    console.log('LOADER');

    throw "Don't succeed to create a map";
  },
});

const useDebounceState = <T,>(initialValue: T, delay = 300) => {
  const [state, setState] = useState<T>(initialValue);
  const debounceState = useDebounce(state, delay);
  return { state, debounceState, setState };
};
const useEffectSkipFirst = (effect: EffectCallback, deps?: DependencyList) => {
  const isFirst = useRef(true);
  useEffect(() => {
    if (!isFirst.current) {
      effect();
    }
    isFirst.current = false;
  }, deps);
};
const Component = () => {
  const { q, id } = Route.useSearch();
  const { id: loadedId } = Route.useLoaderData() || {};
  const navigate = useNavigate();

  const {
    data: { body: mapData },
  } = useSuspenseQuery(mapQueryOptions(id));
  const { state: temporaryMap, setState: setTemporaryMap, debounceState: debounceMap } = useDebounceState(mapData, 1_000);
  const { mutate: patchMap } = useMutation({
    mutationFn: (newMap: { title?: string | undefined; description?: string | undefined; isDraft?: boolean | undefined }) =>
      client.patchMaps({ params: { id: id! }, body: newMap }),
    onSuccess: (data) => {
      if (data.status !== 200) return;
      queryClient.setQueryData(mapQueryOptions(data.body.id).queryKey, data);
    },
  });

  const { state: qState, debounceState: debouncedQState, setState: setQState } = useDebounceState(q);
  const { data: searchData } = useQuery({
    queryKey: ['tmdb-search', debouncedQState],
    queryFn: () => client.searchTmdb({ query: { q: debouncedQState } }),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  const { mutate, status, variables } = useMutation({
    mutationFn: (id: number) => client.postTmdbMovie({ params: { id } }),
  });

  useEffect(() => {
    if (!id) navigate({ search: { id: loadedId, q } });
  }, [loadedId, id, q, navigate]);

  useEffectSkipFirst(() => {
    patchMap(debounceMap);
  }, [debounceMap]);

  if (searchData?.status !== 200) return;

  return (
    <div className="p-12 container max-w-2xl gap-8  flex flex-col ">
      <Typography variant={'h1'} className="self-center">
        Création d'une carte
      </Typography>
      <Typography variant={'h2'} className="sticky flex-1 top-0 pt-2 bg-background">
        1. Le titre
      </Typography>
      <div className="flex flex-row gap-4 items-center">
        <Input
          onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, title: value }))}
          value={temporaryMap.title}
          placeholder="Harry ..."
          className="text-xl h-14 font-bold"
        />
        <div className="border rounded-md h-14 aspect-square flex flex-row items-center justify-center">
          {(temporaryMap.title?.length || 0) >= 3 ? (
            <CheckIcon className="w-6 h-6 text-green-500" />
          ) : (
            <Cross1Icon className="w-6 h-6 text-zinc-500" />
          )}
        </div>
      </div>
      <Typography variant={'h2'} className="sticky top-0 pt-2 bg-background">
        2. Les films
      </Typography>

      <Input
        onChange={({ target: { value } }) => {
          setQState(value);
          navigate({ search: { q: debouncedQState, id } });
        }}
        value={capitalizeFirstLetter(qState)}
        placeholder="Harry ..."
      />

      {searchData.body
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

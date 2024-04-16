import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Typography from '@/components/ui/typography';
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons';
import { keepPreviousData, queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDebounce } from '@uidotdev/usehooks';
import dayjs from 'dayjs';
import { DependencyList, EffectCallback, ReactNode, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { client, queryClient } from '../client';

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

const Step = ({
  title,
  label,
  step,
  children,
  stepValid,
}: {
  title: string;
  label: string;
  step: number;
  children: ReactNode;
  stepValid: boolean;
}) => (
  <div className={cn('mb-32 transform duration-500', { 'mb-12': stepValid })}>
    <div className={cn('flex flex-row gap-4  items-start')}>
      <Typography variant={'h2'} className="sticky flex-1 top-0 pt-2 bg-background">
        {step}. {title}
      </Typography>
      <div className="border rounded-md h-14 aspect-square flex flex-row items-center justify-center">
        {stepValid ? <CheckIcon className="w-6 h-6 text-green-500" /> : <Cross1Icon className="w-6 h-6 text-zinc-500" />}
      </div>
    </div>
    <p className="mt-2 mb-4 text-sm text-muted-foreground">{label}</p>
    {children}
  </div>
);
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

  const steps = {
    title: (temporaryMap?.title?.length || 0) >= 3,

    description: (temporaryMap.description?.length || 0) >= 5,
  };

  if (searchData?.status !== 200) return;

  return (
    <div className="p-12 container max-w-2xl min-h-screen flex flex-col ">
      <Typography variant={'h1'} className="self-center mb-24">
        Création d'une carte
      </Typography>
      <Step title="Le titre" label="Titre de votre carte de film (min 3 caractères)" step={1} stepValid={steps.title}>
        <Input
          onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, title: value }))}
          value={temporaryMap.title}
          placeholder="La carte du monde"
          className="text-xl h-14 font-bold"
        />
      </Step>
      <Step
        title="La description"
        label="Déscritption de votre carte de film (min 5 caractères (+ c'est mieux))"
        step={2}
        stepValid={steps.description}
      >
        <Textarea
          onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, description: value }))}
          value={temporaryMap.description}
          placeholder="Voyager grâce au ..."
        />
      </Step>
      <Step title="Les films" label="La liste des films qui constituent votre carte (min 3)" step={3} stepValid={steps.description}>
        <div className="flex flex-col gap-6 mt-6">
          <Input
            onChange={({ target: { value } }) => {
              setQState(value);
              navigate({ search: { q: value, id: loadedId } });
            }}
            value={qState}
            placeholder="Harry po..."
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
      </Step>
    </div>
  );
};

import { useDebounceState, useEffectSkipFirst } from '@/components/lib/hooks';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Typography from '@/components/ui/typography';
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons';
import { keepPreviousData, queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ReactNode, useEffect, useState } from 'react';
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
    enabled: false,
  });

export const Route = createFileRoute('/createMap')({
  component: () => <Component />,

  validateSearch: (search) => z.object({ q: z.string().optional(), id: z.number().optional() }).optional().default({ q: '' }).parse(search),
  loaderDeps: ({ search: { id } }) => {
    return { id };
  },
  shouldReload: false,
  staleTime: 60_000,
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

    throw "Don't succeed to create a map";
  },
});

const Step = ({
  title,
  label,
  step,
  children,
  isStepValid,
  isPreviousStepsValid,
}: {
  title: string;
  label: string;
  step: number;
  isPreviousStepsValid: boolean;
  children: ReactNode;
  isStepValid: boolean;
}) => (
  <div className={cn('mb-24 transform duration-500', { 'mb-12': isStepValid, 'opacity-50': !isPreviousStepsValid })}>
    <div className={cn('flex flex-row gap-4 sticky top-0 items-start bg-background')}>
      <Typography id={`${title}`} variant={'h2'} className=" flex-1  pt-2">
        {step}. {title}
      </Typography>

      <div className="border rounded-md h-12 mt-1 aspect-square flex flex-row items-center justify-center">
        {isStepValid ? <CheckIcon className="w-6 h-6 text-green-500" /> : <Cross1Icon className="w-6 h-6 text-zinc-500" />}
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
  } = useSuspenseQuery(mapQueryOptions(loadedId));
  const { mutate: patchMap } = useMutation({
    mutationFn: (newMap: { title?: string | undefined; description?: string | undefined; isDraft?: boolean | undefined }) =>
      client.patchMaps({ params: { id: id! }, body: newMap }),
    onSuccess: (data) => {
      if (data.status !== 200) return;
      queryClient.setQueryData(mapQueryOptions(data.body.id).queryKey, data);
    },
  });
  const {
    mutate: addMovieToMap,
    status: statusAdd,
    variables: variablesAdd,
  } = useMutation({
    mutationFn: (tmdbId: number) => client.addMovieToMap({ params: { id: id! }, body: { tmdbId } }),
    onSuccess: (data) => {
      if (data.status !== 200) return;
      queryClient.setQueryData(mapQueryOptions(data.body.id).queryKey, data);
    },
  });
  const {
    mutate: deleteMovieFromMap,
    status: statusDelete,
    variables: variablesDelete,
  } = useMutation({
    mutationFn: (movieId: number) => client.deleteMovieFromMap({ params: { id: id!, movieId } }),
    onSuccess: (data) => {
      if (data.status !== 200) return;
      queryClient.setQueryData(mapQueryOptions(data.body.id).queryKey, data);
    },
  });

  const {
    state: temporaryMap,
    setState: setTemporaryMap,
    debounceState: debounceMap,
  } = useDebounceState({ title: mapData.title, description: mapData.description, isDraft: mapData.isDraft }, 1_000);

  const [openAddMovie, setOpenAddMovie] = useState(false);

  const { state: qState, debounceState: debouncedQState, setState: setQState } = useDebounceState(q ?? '');
  const { data: searchData } = useQuery({
    queryKey: ['tmdb-search', debouncedQState],
    queryFn: () => client.searchTmdb({ query: { q: debouncedQState } }),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (id !== loadedId) navigate({ search: { id: loadedId, q }, replace: true });
  }, [loadedId, id, q, navigate]);

  useEffectSkipFirst(() => {
    id && patchMap(debounceMap);
  }, [debounceMap]);

  const steps = {
    title: (temporaryMap?.title?.length || 0) >= 3,
    description: (temporaryMap.description?.length || 0) >= 5,
    movies: mapData.movies.length >= 3,
  };

  if (searchData?.status !== 200) return;

  return (
    <>
      <div className="p-12 container max-w-2xl min-h-screen flex flex-col ">
        <Typography variant={'h1'} className="self-center mb-24">
          Création d'une carte
        </Typography>
        <Step title="Le titre" label="Titre de votre carte de film (min 3 caractères)" step={1} isStepValid={steps.title} isPreviousStepsValid>
          <Input
            onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, title: value }))}
            value={temporaryMap.title}
            placeholder="La carte du monde"
            className="text-xl h-14 font-bold"
          />
        </Step>
        <Step
          isPreviousStepsValid={steps.title}
          title="La description"
          label="Déscritption de votre carte de film (min 5 caractères (+ c'est mieux))"
          step={2}
          isStepValid={steps.description}
        >
          <Textarea
            onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, description: value }))}
            value={temporaryMap.description}
            placeholder="Voyager grâce au ..."
          />
        </Step>
        <Step
          isPreviousStepsValid={steps.title && steps.description}
          title={`Les films (${mapData.movies.length})`}
          label="La liste des films qui constituent votre carte (min 3)"
          step={3}
          isStepValid={steps.movies}
        >
          <div className="flex flex-col gap-6 mt-6">
            <Button
              onClick={() => {
                setOpenAddMovie(true);
              }}
            >
              Ajouter un film
            </Button>
            <div className="flex flex-row gap-4 justify-between py-6 flex-wrap">
              {mapData.movies.map(({ title, posterPath }) => (
                <div className="h-48 aspect-[2/3]" key={posterPath}>
                  <img alt={title} className="object-cover h-48 rounded-md shadow-lg " src={`https://image.tmdb.org/t/p/original/${posterPath}`} />
                </div>
              ))}
            </div>
          </div>
        </Step>
      </div>

      <CommandDialog
        className="max-w-2xl w-full"
        open={openAddMovie}
        onOpenChange={(open) => {
          setOpenAddMovie(open);
          setQState('');
          navigate({ search: { q: '', id: loadedId }, replace: true });
        }}
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Harry potter..."
          onValueChange={(value) => {
            setQState(value);
            navigate({ search: { q: value, id: loadedId }, replace: true });
          }}
          value={qState}
        />
        <CommandList className="h-96">
          <CommandEmpty>No results found.</CommandEmpty>

          {searchData.body
            .filter(({ posterPath }) => !!posterPath)
            .map(({ title, id, posterPath, releaseDate }) => {
              const isSelected = mapData.movies.some((movie) => movie.tmdbId === id);
              const dbId = mapData.movies.find((movie) => movie.tmdbId === id)?.id || 0;
              const isLoading = (statusAdd === 'pending' && id === variablesAdd) || (statusDelete === 'pending' && id === variablesDelete);
              return (
                <CommandItem
                  className="gap-2 items-center"
                  onSelect={() => (isSelected ? deleteMovieFromMap(dbId) : addMovieToMap(id))}
                  disabled={isLoading}
                  key={title}
                  value={`${title}${releaseDate}`}
                >
                  <img
                    alt={title}
                    className="object-cover h-24 rounded-md shadow-lg  aspect-[2/3] "
                    src={`https://image.tmdb.org/t/p/original/${posterPath}`}
                  />
                  <div className="flex flex-col">
                    <Typography variant={'p'} affects={'large'} className="line-clamp-2">
                      {title}
                    </Typography>
                    <Typography variant={'p'} affects={'muted'}>
                      {dayjs(releaseDate).format('DD/MM/YYYY')}
                    </Typography>
                  </div>
                  <div className="flex-1" />
                  <Button variant={isSelected ? 'secondary' : 'default'} disabled={isLoading}>
                    {!isSelected ? 'Ajouter' : 'Enlever'}
                  </Button>
                </CommandItem>
              );
            })}
        </CommandList>
      </CommandDialog>
    </>
  );
};

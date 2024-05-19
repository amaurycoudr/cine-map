import { useDebounceState, useEffectSkipFirst } from '@/components/lib/hooks';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import Typography from '@/components/ui/typography';
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons';
import { queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ReactNode, useEffect, useRef, useState } from 'react';
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

export const Route = createFileRoute('/create_map')({
  component: () => <Component />,

  validateSearch: (search) => z.object({ q: z.string().optional(), id: z.number().optional() }).optional().default({}).parse(search),
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

const Component = () => {
  const { q, id } = Route.useSearch();
  const { id: loadedId } = Route.useLoaderData() || {};
  const navigate = useNavigate();
  const refInputTitle = useRef<HTMLInputElement>(null);
  const {
    data: { body: mapData },
  } = useSuspenseQuery(mapQueryOptions(loadedId));
  const { mutate: patchMap } = useMutation({
    mutationFn: (newMap: { title?: string | undefined; description?: string | undefined; isDraft?: boolean | undefined }) =>
      client.patchMaps({ params: { id: id! }, body: newMap }),
    onSuccess: (data) => {
      if (data.status !== 200) return;
      queryClient.setQueryData(mapQueryOptions(data.body.id).queryKey, data);
      if (data.body.isDraft === false) navigate({ to: '/' });
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

  const [openAddMovie, setOpenAddMovie] = useState(!!q);

  const { state: qState, debounceState: debouncedQState, setState: setQState } = useDebounceState(q ?? '');
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['tmdb-search', debouncedQState],
    queryFn: () => client.searchTmdb({ query: { q: debouncedQState } }),
    //placeholderData: keepPreviousData,
    staleTime: Infinity,
    enabled: !!debouncedQState,
  });

  useEffect(() => {
    if (id !== loadedId) navigate({ search: { id: loadedId, q }, replace: true });
  }, [loadedId, id, q, navigate]);

  useEffect(() => {
    refInputTitle.current?.focus();
  }, []);
  useEffectSkipFirst(() => {
    id && patchMap(debounceMap);
  }, [debounceMap]);

  const steps = {
    title: {
      isStepValid: (temporaryMap?.title?.trim().length || 0) >= 3,
      title: 'Le titre',
      label: 'Titre de votre carte de film (min 3 caractères)',
      step: 1,
    },
    description: {
      isStepValid: (temporaryMap.description?.trim().length || 0) >= 5,
      title: 'La description',
      label: "Déscritption de votre carte de film (min 5 caractères (+ c'est mieux))",
      step: 2,
    },
    movies: {
      isStepValid: mapData.movies.length >= 3,
      title: `Les films (${mapData.movies.length})`,
      label: 'La liste des films qui constituent votre carte (min 3)',
      step: 3,
    },
  };
  const [focusStep, setFocusStep] = useState<number | undefined>(undefined);

  return (
    <div className="px-4">
      <div className="container relative flex min-h-screen w-full max-w-3xl flex-col px-0 pb-24 pt-12 ">
        <Typography variant={'h1'} className="mb-12 self-center">
          Création d'une carte
        </Typography>
        <Step {...steps.title} isPreviousStepsValid isFocus={focusStep === steps.title.step}>
          <Input
            onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, title: value }))}
            value={temporaryMap.title}
            onFocus={() => {
              setFocusStep(steps.title.step);
            }}
            onBlur={() => {
              setFocusStep(undefined);
            }}
            ref={refInputTitle}
            placeholder="La carte du monde"
            className="h-14 text-xl font-bold"
          />
        </Step>
        <Step isPreviousStepsValid={steps.title.isStepValid} {...steps.description} isFocus={focusStep === steps.description.step}>
          <Textarea
            onChange={({ target: { value } }) => setTemporaryMap((prev) => ({ ...prev, description: value }))}
            value={temporaryMap.description}
            onFocus={() => {
              setFocusStep(steps.description.step);
            }}
            onBlur={() => {
              setFocusStep(undefined);
            }}
            placeholder="Voyager grâce au ..."
          />
        </Step>
        <Step
          isPreviousStepsValid={steps.title.isStepValid && steps.description.isStepValid}
          {...steps.movies}
          isFocus={focusStep === steps.movies.step}
        >
          <div
            className="mt-6 flex flex-col gap-6"
            onClick={() => {
              setFocusStep(steps.movies.step);
            }}
          >
            <Button
              onClick={() => {
                setOpenAddMovie(true);
              }}
            >
              Ajouter un film
            </Button>
            <div className="flex flex-col justify-between gap-8">
              {mapData.movies.map(({ title, poster, overview, id, releaseDate }) => (
                <div key={`${title}${releaseDate}`} className="flex gap-4">
                  <div className="aspect-[2/3] h-48 self-center" key={poster}>
                    <img alt={title} className="rounded-md object-cover shadow-lg " src={`https://image.tmdb.org/t/p/original/${poster}`} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Typography variant={'h2'}>
                      {title} <span className="text-muted-foreground text-sm">({dayjs(releaseDate).format('DD/MM/YYYY')})</span>
                    </Typography>
                    <p className="text-muted-foreground mt-3 line-clamp-5 text-justify">{overview}</p>
                  </div>
                  <Button onClick={() => deleteMovieFromMap(id)} variant={'secondary'} className="self-center">
                    Enlever
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Step>
        <div className="fixed bottom-6 left-1/2 w-full max-w-xl -translate-x-1/2 px-6">
          <div className="bg-background rounded-lg">
            <Button
              disabled={Object.values(steps).some((step) => !step.isStepValid)}
              className="w-full bg-green-600  shadow-2xl shadow-green-600 hover:bg-green-500 active:bg-green-500"
              onClick={() => patchMap({ isDraft: false })}
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <CommandDialog
        className="w-full max-w-2xl"
        open={openAddMovie}
        onOpenChange={(open) => {
          setOpenAddMovie(open);
          setQState('');
          navigate({ search: { id: loadedId }, replace: true });
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
        <CommandList className="h-96 px-2">
          <CommandEmpty className="flex flex-1 flex-col justify-center">
            {isLoadingSearch &&
              Array(10)
                .fill(undefined)
                .map(() => (
                  <div className="aria-selected:bg-accent aria-selected:text-accent-foreground relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none">
                    <Skeleton className="aspect-[2/3] h-24 rounded-md" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex-1" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
            {!isLoadingSearch && (
              <div className="flex justify-center p-10">
                <Typography variant={'h4'} className=" self-center">
                  {!debouncedQState ? 'On attend vos intructions chef !' : 'Rien de connu sous ce nom chef !'}
                </Typography>
              </div>
            )}
          </CommandEmpty>

          {(searchData?.status === 200 ? searchData.body : [])
            .filter(({ poster }) => !!poster)
            .map(({ title, id, poster, releaseDate }) => {
              const isSelected = mapData.movies.some((movie) => movie.tmdbId === id);
              const dbId = mapData.movies.find((movie) => movie.tmdbId === id)?.id || 0;
              const isLoading = (statusAdd === 'pending' && id === variablesAdd) || (statusDelete === 'pending' && id === variablesDelete);
              return (
                <CommandItem
                  className="items-center gap-2"
                  onSelect={() => (isSelected ? deleteMovieFromMap(dbId) : addMovieToMap(id))}
                  disabled={isLoading}
                  key={`${title}${releaseDate}`}
                  value={`${title}${releaseDate}`}
                >
                  <img alt={title} className="aspect-[2/3] h-24 rounded-md object-cover  shadow-lg " src={poster!} />
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
    </div>
  );
};

const Step = ({
  title,
  label,
  step,
  children,
  isStepValid,
  isPreviousStepsValid,
  isFocus,
}: {
  title: string;
  label: string;
  step: number;
  isPreviousStepsValid: boolean;
  children: ReactNode;
  isStepValid: boolean;
  isFocus: boolean;
}) => (
  <div
    className={cn('bg-background mb-12 transform rounded-xl border px-6 py-8 duration-300', {
      'mb-8': isStepValid,
      'opacity-50': !isPreviousStepsValid && !isFocus,
      'shadow-xl': isFocus,
    })}
  >
    <div className={cn('bg-background sticky top-0 flex flex-row items-start gap-4')}>
      <Typography id={`${title}`} variant={'h2'} className=" flex-1  pt-2">
        {step}. {title}
      </Typography>

      <div className="mt-1 flex aspect-square h-12 flex-row items-center justify-center rounded-md border">
        {isStepValid ? <CheckIcon className="h-6 w-6 text-green-500" /> : <Cross1Icon className="h-6 w-6 text-zinc-500" />}
      </div>
    </div>
    <p className="text-muted-foreground mb-4 mt-2 text-sm">{label}</p>
    {children}
  </div>
);

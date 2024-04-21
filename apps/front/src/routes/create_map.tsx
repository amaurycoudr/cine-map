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
import { ReactNode, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { client, queryClient } from '../client';
import { Skeleton } from '@/components/ui/skeleton';

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
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    enabled: !!debouncedQState,
  });

  useEffect(() => {
    if (id !== loadedId) navigate({ search: { id: loadedId, q }, replace: true });
  }, [loadedId, id, q, navigate]);

  console.log(refInputTitle);
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
      <div className="pt-12 pb-24 px-0 container relative max-w-3xl w-full min-h-screen flex flex-col ">
        <Typography variant={'h1'} className="self-center mb-12">
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
            className="text-xl h-14 font-bold"
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
            className="flex flex-col gap-6 mt-6"
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
            <div className="flex flex-col gap-8 justify-between">
              {mapData.movies.map(({ title, posterPath, overview, id, releaseDate }) => (
                <div key={`${title}${releaseDate}`} className="flex gap-4">
                  <div className="h-48 self-center aspect-[2/3]" key={posterPath}>
                    <img alt={title} className="object-cover rounded-md shadow-lg " src={`https://image.tmdb.org/t/p/original/${posterPath}`} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <Typography variant={'h2'}>
                      {title} <span className="text-sm text-muted-foreground">({dayjs(releaseDate).format('DD/MM/YYYY')})</span>
                    </Typography>
                    <p className="mt-3 text-muted-foreground line-clamp-5 text-justify">{overview}</p>
                  </div>
                  <Button onClick={() => deleteMovieFromMap(id)} variant={'secondary'} className="self-center">
                    Enlever
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Step>
        <div className="fixed -translate-x-1/2 left-1/2 px-6 bottom-6 max-w-xl w-full">
          <div className="bg-background rounded-lg">
            <Button
              disabled={Object.values(steps).some((step) => !step.isStepValid)}
              className="bg-green-600 w-full  hover:bg-green-500 active:bg-green-500 shadow-2xl shadow-green-600"
              onClick={() => patchMap({ isDraft: false })}
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <CommandDialog
        className="max-w-2xl w-full"
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
          <CommandEmpty className="flex flex-1 justify-center flex-col">
            {isLoadingSearch &&
              Array(10)
                .fill(undefined)
                .map(() => (
                  <div className="relative flex select-none rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground gap-2 items-center">
                    <Skeleton className="h-24 aspect-[2/3] rounded-md" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex-1" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
            {!isLoadingSearch && (
              <div className="p-10 justify-center flex">
                <Typography variant={'h4'} className=" self-center">
                  {!debouncedQState ? 'On attend vos intructions chef !' : 'Rien de connu sous ce nom chef !'}
                </Typography>
              </div>
            )}
          </CommandEmpty>

          {(searchData?.status === 200 ? searchData.body : [])
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
                  key={`${title}${releaseDate}`}
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
    className={cn('mb-12 px-6 py-8 border transform  shadow duration-300 bg-background rounded-xl', {
      'mb-8': isStepValid,
      'opacity-50': !isPreviousStepsValid && !isFocus,
      'shadow-xl': isFocus,
    })}
  >
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

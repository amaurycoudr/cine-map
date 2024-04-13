export const GENDERS = ['0', '1', '2', '3'] as const;
export const GENDERS_TRANSCO = {
  unknown: '0',
  woman: '1',
  man: '2',
  'non binary': '3',
} as const;
export type Gender = (typeof GENDERS)[number];

export const JOBS = ['0', '1', '2', '3', '4', '5', '6', '7'] as const;
export const JOBS_TRANSCO = {
  actor: '0',
  screenPlay: '1',
  director: '2',
  editor: '3',
  'director of Photography': '4',
  producer: '5',
  unknown: '6',
  composer: '7',
} as const;

export type Jobs = (typeof JOBS)[number];

export const getJobFromTmdb = (job: string): Jobs => {
  if (job === 'Producer') return '5';
  else if (job === 'Original Music Composer') return '7';
  else if (job === 'Screenplay') return '1';
  else if (job === 'Director') return '2';
  else if (job === 'Director of Photography') return '4';
  else if (job === 'Editor') return '3';
  else if (job === 'Actor') return '0';

  return '6';
};

export const getJobFromTmbDepartment = (department: string): Jobs => {
  if (department === 'Acting') return '0';
  if (department === 'Production') return '5';
  else if (department === 'Directing') return '2';
  else if (department === 'Camera') return '4';
  else if (department === 'Sound') return '7';
  else if (department === 'Writing') return '1';
  else if (department === 'Editing') return '3';

  return '6';
};

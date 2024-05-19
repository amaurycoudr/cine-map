import { JOBS_TRANSCO } from '@cine-map/contract';
import { Crew } from './apiTypes';

export const getDirectors = (crew: Crew) => crew.filter(({ job }) => job === JOBS_TRANSCO.director);

export const getPersonsName = <T extends { person: { name: string } }>(persons: T[]) => persons.map(({ person }) => person.name).join(',  ');

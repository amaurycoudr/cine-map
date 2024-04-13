import { extendZodWithOpenApi } from '@anatine/zod-openapi';
// eslint-disable-next-line no-restricted-imports
import { z } from 'zod';

extendZodWithOpenApi(z);

export { z as zOA };

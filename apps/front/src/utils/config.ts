import { z } from 'zod';

const envSchema = z
  .object({
    VITE_CLOUDFLARE_URL: z.string(),
    VITE_BACKEND_URL: z.string(),
  })
  .transform(({ VITE_CLOUDFLARE_URL, VITE_BACKEND_URL }) => ({
    cloudflareUrl: VITE_CLOUDFLARE_URL,
    backendUrl: VITE_BACKEND_URL,
  }));

//@ts-expect-error .env exist
const envConfig = envSchema.parse(import.meta.env);

export default envConfig;

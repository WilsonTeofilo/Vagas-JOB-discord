import { randomBytes } from 'crypto';

/** GET /api/setup/generate-secret — gera um NEXTAUTH_SECRET seguro. */
export async function GET() {
  const secret = randomBytes(48).toString('base64');
  return Response.json({ secret });
}

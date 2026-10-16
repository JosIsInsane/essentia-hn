import type { Fn } from '../../../server/env';
import { json } from '../../../server/http';
import { loadAdminCatalog } from '../../../server/catalog';

export const onRequestGet: Fn = async ({ env }) => json(await loadAdminCatalog(env.DB, env));

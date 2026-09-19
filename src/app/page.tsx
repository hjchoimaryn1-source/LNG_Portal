import LNGPortalApp from '../components/LNGPortalApp';
import { getUserSecurityDb } from '../lib/rbac/userSecurityDbSingleton';
import { listLoginDirectory, type LoginDirectoryEntry } from '../lib/rbac/userSecurityLoginDirectoryDao';

// force-dynamic — a login directory prefetched at build time would go stale
// the moment an admin creates/locks an account via the Admin tab; this route
// must re-query user_accounts/personnel_master on every request.
export const dynamic = 'force-dynamic';

function fetchInitialLoginDirectory(): LoginDirectoryEntry[] | undefined {
  try {
    return listLoginDirectory(getUserSecurityDb());
  } catch {
    // SSR prefetch is a "prefer" optimization, not a hard dependency — if it
    // fails for any reason, LoginGateway.tsx falls back to its own client-side
    // fetch of the same endpoint (see its useEffect).
    return undefined;
  }
}

export default function Home() {
  const initialLoginDirectory = fetchInitialLoginDirectory();
  return <LNGPortalApp initialLoginDirectory={initialLoginDirectory} />;
}

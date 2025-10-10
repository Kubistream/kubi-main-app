// Use full zod export to maximize compatibility with Next/Webpack resolvers.
// z.encode is available from the classic build as well.
import * as z from "zod";

export { z };

// Note:
// We only need to provide `z` for consumers (e.g. @wagmi/connectors/porto)
// to access `z.encode` from zod v4 mini. Re-exporting other internals
// (Call, TrustedHosts) is unnecessary here and can cause TS resolution issues.

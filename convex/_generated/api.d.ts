/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentConfigs from "../agentConfigs.js";
import type * as appointments from "../appointments.js";
import type * as chatMessages from "../chatMessages.js";
import type * as chatSessions from "../chatSessions.js";
import type * as constants from "../constants.js";
import type * as knowledgeEntries from "../knowledgeEntries.js";
import type * as users from "../users.js";
import type * as workspaceKnowledgeEntries from "../workspaceKnowledgeEntries.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentConfigs: typeof agentConfigs;
  appointments: typeof appointments;
  chatMessages: typeof chatMessages;
  chatSessions: typeof chatSessions;
  constants: typeof constants;
  knowledgeEntries: typeof knowledgeEntries;
  users: typeof users;
  workspaceKnowledgeEntries: typeof workspaceKnowledgeEntries;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

/**
 * WebSocket client library to communicate with Winerp server.
 * @module
 * @example
 * ```ts
 * import { Client } from "@shahriyarx/winerp-client-node"
 * 
 * client = new Client({ host: "localhost", port: 2033, local_name: "dashboard" })
 * 
 * // Making request
 * await client.request({ destination: "bot", route: "guild_roles", data: { guild_id: 123 } })
 */
export * from "./client";
export * from "./types";

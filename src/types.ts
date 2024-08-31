/**
 * Enum representing different types of payloads.
 * @enum {number}
 */
export enum Paylods {
	success = 0,
	verification = 1,
	request = 2,
	response = 3,
	error = 4,
	ping = 5,
	information = 6,
	function_call = 7,
}

/**
 * The properties required to initialize a Client.
 * @typedef {Object} ClientProps
 * @property {string} host - The WebSocket server host.
 * @property {string} port - The WebSocket server port.
 * @property {string} local_name - The local identifier for the client.
 */
export type ClientProps = {
	host: string
	port: string
	local_name: string
}

/**
 * The properties required to make a request.
 * @typedef {Object} RequestProps
 * @property {string} route - The route to which the request is sent.
 * @property {string} destination - The destination client identifier.
 * @property {Record<string, unknown>} data - The data to send with the request.
 * @property {number} [timeout] - The timeout in seconds before the request fails.
 */
export type RequestProps = {
	route: string
	destination: string
	data: Record<string, unknown>
	timeout?: number
}

/**
 * The payload for an information message.
 * @typedef {Object} InformPayload
 * @property {string} route - The route associated with the information.
 * @property {string[]} destinations - The destinations to send the information to.
 * @property {Record<string, unknown>} data - The data to send with the information.
 */
export type InformPayload = {
	route: string
	destinations: string[]
	data: Record<string, unknown>
}

/**
 * A handler function for a specific route.
 * @callback RouteHandler
 * @param {Record<string, unknown> | string} data - The data received for the route.
 * @returns {Promise<Record<string, unknown> | string>} - A promise that resolves with the response data.
 */
export type RouteHandler = (
	data: Record<string, unknown> | string,
) => Promise<Record<string, unknown> | string>

/**
 * Class representing a message payload.
 */
export class MessagePayload {
	id?: string
	type: Paylods
	route?: string | string[]
	traceback?: string
	data: Record<string, unknown> | string
	uuid?: string
	destination?: string
	pseudo_object?: unknown

	/**
	 * Creates an instance of MessagePayload.
	 * @param {Object} msg - The message object containing payload properties.
	 * @param {string} [msg.id] - The identifier of the client sending the message.
	 * @param {Paylods} msg.type - The type of payload.
	 * @param {string | string[]} [msg.route] - The route or routes associated with the payload.
	 * @param {string} [msg.traceback] - Traceback information for error handling.
	 * @param {Record<string, unknown> | string} [msg.data] - The data associated with the payload.
	 * @param {string} [msg.uuid] - The unique identifier for the message.
	 * @param {string} [msg.destination] - The destination client identifier.
	 * @param {unknown} [msg.pseudo_object] - An optional pseudo-object for custom data.
	 */
	constructor(msg: {
		id?: string
		type: Paylods
		route?: string | string[]
		traceback?: string
		data?: Record<string, unknown> | string
		uuid?: string
		destination?: string
		pseudo_object?: unknown
	}) {
		this.id = msg.id
		this.type = msg.type
		this.route = msg.route
		this.traceback = msg.traceback
		this.data = msg.data || {}
		this.uuid = msg.uuid
		this.destination = msg.destination
		this.pseudo_object = msg.pseudo_object
	}

	/**
	 * Converts the message payload to a JSON string.
	 * @returns {string} - The JSON string representation of the payload.
	 */
	toString(): string {
		return JSON.stringify({
			id: this.id,
			type: this.type,
			route: this.route,
			data: this.data,
			traceback: this.traceback,
			uuid: this.uuid,
			destination: this.destination,
			pseudo_object: this.pseudo_object,
		})
	}
}

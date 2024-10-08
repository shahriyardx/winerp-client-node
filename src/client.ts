import { v4 as uuid4 } from "uuid"
import { WebSocket, type Event, type MessageEvent } from "ws"
import {
	Paylods,
	MessagePayload,
	type ClientProps,
	type InformPayload,
	type RequestProps,
	type RouteHandler,
} from "./types"

/**
 * Class representing a WebSocket client.
 */
export class Client {
	private static connection: WebSocket
	private routes: Map<string, RouteHandler>
	private _authorized: boolean
	private _on_hold: boolean
	private local_name: string
	private host: string
	private port: string

	is_connected: boolean

	/**
	 * Creates an instance of Client.
	 * @param {ClientProps} props - The properties required to initialize the client.
	 */
	constructor({ host, port, local_name }: ClientProps) {
		this.host = host
		this.port = port
		this._authorized = false
		this._on_hold = false
		this.is_connected = false
		this.local_name = local_name
		this.routes = new Map()

		this.__connect()
	}

	/**
	 * connects to the websocket client
	 * @private
	 */
	__connect = (): void => {
		if (!Client.connection) {
			Client.connection = new WebSocket(`ws://${this.host}:${this.port}`)
			Client.connection.addEventListener("message", this.handleMessage)
			Client.connection.addEventListener("open", this.handleConnect)
			Client.connection.addEventListener("close", this.handleDisconnect)
		}
	}

	/**
	 * Sends a verification message to the server.
	 * @private
	 */
	__verify = (): void => {
		Client.connection.send(
			JSON.stringify({
				id: this.local_name,
				uuid: uuid4(),
				type: Paylods.verification,
			}),
		)
	}

	/**
	 * Handles the WebSocket connection open event.
	 * @private
	 */
	handleConnect = (): void => {
		this.__verify()
		this.is_connected = true
	}

	/**
	 * Handles the WebSocket connection close event.
	 * @param {Event} event - The event object associated with the close event.
	 * @private
	 */
	handleDisconnect = (event: Event): void => {
		console.log("Disconnected", event)
	}

	/**
	 * Handles incoming messages from the WebSocket.
	 * @param {MessageEvent} event - The event object associated with the message event.
	 * @private
	 */
	handleMessage = (event: MessageEvent): void => {
		const data = JSON.parse(event.data as string) as MessagePayload

		if (data.type === Paylods.success) {
			this._authorized = true
			this._on_hold = false
		}

		if (data.type === Paylods.error && data.data === "Already authorized.") {
			this._on_hold = true
		}

		if (data.type === Paylods.request) {
			const route = this.routes.get(data.route as string)
			if (!route) {
				const payload = new MessagePayload({
					type: Paylods.error,
					id: this.local_name,
					data: "Route not found",
					traceback: "Route not found",
					destination: data.id,
					uuid: data.uuid,
				})

				Client.connection.send(payload.toString())
				return
			}

			route(data.data)
				.then((res) => {
					const payload = new MessagePayload({
						id: this.local_name,
						type: Paylods.response,
						data: res,
					})

					Client.connection.send(payload.toString())
				})
				.catch((error) => {
					let error_message = "Internal Server Error"
					if (error instanceof Error) error_message = error.message

					Client.connection.send(
						new MessagePayload({
							id: this.local_name,
							type: Paylods.error,
							data: error_message,
						}).toString(),
					)
				})
		}
	}

	/**
	 * Sends an information message to specified destinations.
	 * @param {InformPayload} informPayload - The payload containing destinations and data.
	 * @example
	 * ```ts
	 * client.inform({
	 * 	destinations: ["bot"],
	 * 	data: {
	 * 		sync: true,
	 * 	},
	 * })
	 * ```
	 */
	inform = ({ destinations, data }: InformPayload): void => {
		if (!this._authorized) throw new Error("The client is not authorized.")
		if (this._on_hold) throw new Error("The client is on hold")

		Client.connection.send(
			new MessagePayload({
				type: Paylods.information,
				route: Array.isArray(destinations) ? destinations : [destinations],
				data: data,
			}).toString(),
		)
	}

	/**
	 * Sends a request and waits for a response.
	 * @template T
	 * @param {RequestProps} requestProps - The properties required to make a request.
	 * @returns {Promise<T>} - A promise that resolves to the response data.
	 * @example
	 * ```ts
	 * client.request({
	 * 	destination: "bot",
	 * 	route: "get_roles",
	 * 	data: {
	 * 		guild_id: 123,
	 * 	},
	 * 	timeout: 60,
	 * })
	 * ```
	 */
	request = <T>({
		destination,
		route,
		data,
		timeout = 60,
	}: RequestProps): Promise<T> => {
		if (!this._authorized) throw new Error("The client is not authorized.")
		if (this._on_hold) throw new Error("The client is on hold")

		return new Promise((resolve) => {
			const uuid = uuid4()
			const payload = new MessagePayload({
				type: Paylods.request,
				id: this.local_name,
				destination: destination,
				route: route,
				data: data,
				uuid: uuid,
			})

			Client.connection.send(payload.toString())

			const respond = (event: MessageEvent) => {
				const data = JSON.parse(event.data as string) as MessagePayload

				if (data.uuid === uuid) {
					if (data.type === Paylods.response) {
						Client.connection.removeEventListener("message", respond)
						clearTimeout(_timeout)
						resolve(data.data as T)
					} else if (data.type === Paylods.error) {
						Client.connection.removeEventListener("message", respond)
						clearTimeout(_timeout)
						resolve(null as T)
					}
				}
			}

			Client.connection.addEventListener("message", respond)

			const _timeout = setTimeout(() => {
				Client.connection.removeEventListener("message", respond)
				resolve(null as T)
			}, timeout * 1000)
		})
	}

	/**
	 * Registers a route handler for a specific route name.
	 * @param {string} name - The name of the route.
	 * @param {RouteHandler} handler - The handler function for the route.
	 */
	route = (name: string, handler: RouteHandler): void => {
		this.routes.set(name, handler)
	}
}

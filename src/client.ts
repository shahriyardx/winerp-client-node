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

export class Client {
	private client: WebSocket
	private routes: Map<string, RouteHandler>
	private _authorized: boolean
	private _on_hold: boolean
	private local_name: string

	constructor({ host, port, local_name }: ClientProps) {
		this.client = new WebSocket(`ws://${host}:${port}`)
		this._authorized = false
		this._on_hold = false
		this.local_name = local_name
		this.routes = new Map()
		this.client.addEventListener("message", this.handleMessage)
		this.client.addEventListener("open", this.handleConnect)
		this.client.addEventListener("close", this.handleDisconnect)
		this
	}

	__verify = (): void => {
		this.client.send(
			JSON.stringify({
				id: this.local_name,
				uuid: uuid4(),
				type: Paylods.verification,
			}),
		)
	}

	handleConnect = (): void => {
		this.__verify()
	}

	handleDisconnect = (event: Event): void => {
		console.log("Disconnected", event)
	}

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

				this.client.send(payload.toString())
				return
			}

			route(data.data)
				.then((res) => {
					const payload = new MessagePayload({
						id: this.local_name,
						type: Paylods.response,
						data: res,
					})

					this.client.send(payload.toString())
				})
				.catch((error) => {
					let error_message = "Internal Server Error"
					if (error instanceof Error) error_message = error.message

					this.client.send(
						new MessagePayload({
							id: this.local_name,
							type: Paylods.error,
							data: error_message,
						}).toString(),
					)
				})
		}
	}
	inform = ({ destinations, data }: InformPayload): void => {
		this.client.send(
			new MessagePayload({
				type: Paylods.information,
				route: Array.isArray(destinations) ? destinations : [destinations],
				data: data,
			}).toString(),
		)
	}
	request = <T>({ destination, route, data, timeout = 60 }: RequestProps): Promise<T> => {
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

			this.client.send(payload.toString())

			const respond = (event: MessageEvent) => {
				const data = JSON.parse(event.data as string) as MessagePayload

				if (data.uuid === uuid) {
					if (data.type === Paylods.response) {
						this.client.removeEventListener("message", respond)
						clearTimeout(_timeout)
						resolve(data.data as T)
					} else if (data.type === Paylods.error) {
						this.client.removeEventListener("message", respond)
						clearTimeout(_timeout)
						resolve(null as T)
					}
				}
			}

			this.client.addEventListener("message", respond)

			const _timeout = setTimeout(() => {
				this.client.removeEventListener("message", respond)
				resolve(null as T)
			}, timeout * 1000)
		})
	}

	route = (name: string, handler: RouteHandler): void => {
		this.routes.set(name, handler)
	}
}

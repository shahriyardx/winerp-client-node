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

export type ClientProps = {
	host: string
	port: string
	local_name: string
}

export type RequestProps = {
	route: string
	destination: string
	data: Record<string, unknown>
	timeout?: number
}

export type InformPayload = {
	route: string
	destinations: string[]
	data: Record<string, unknown>
}

export type RouteHandler = (
	data: Record<string, unknown> | string,
) => Promise<Record<string, unknown> | string>

export class MessagePayload {
	id?: string
	type: Paylods
	route?: string | string[]
	traceback?: string
	data: Record<string, unknown> | string
	uuid?: string
	destination?: string
	pseudo_object?: unknown

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

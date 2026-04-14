declare const portBrand: unique symbol

export type Port = number & {
	[portBrand]: never
}

export interface Config {
	readonly basePath: string
	readonly port: Port
	readonly exposeIndex: boolean
	readonly exposeHidden: boolean
	readonly denylist: string[]
	readonly allowlist: string[] | null
}

export function checkString(value: unknown, key: string): asserts value is string {
	if (typeof value != "string") {
		console.error(`Invalid ${key} in config file: must be a string`)
		process.exit(1)
	}
}

export function checkPort(value: number, key: string): asserts value is Port {
	if (isNaN(value) || value < 1 || value > 65535) {
		console.error(`Invalid ${key} in config file: must be an integer between 1 and 65535`)
		process.exit(1)
	}
}

export function checkBoolean(value: unknown, key: string): asserts value is boolean {
	if (typeof value != "boolean") {
		console.error(`Invalid ${key} in config file: must be a boolean`)
		process.exit(1)
	}
}

export function checkStringArray(value: unknown, key: string, nullable: boolean = false): asserts value is string[] {
	if (nullable && value === null) return
	if (!Array.isArray(value) || !value.every((item) => typeof item == "string")) {
		console.error(`Invalid ${key} in config file: must be an array of strings`)
		process.exit(1)
	}
}
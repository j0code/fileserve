import fs from "node:fs/promises"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { basename, normalize } from "node:path/posix"
import config from "./config.js"

const execAsync = promisify(exec)

export function formatSize(size: number) {
	const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
	let exp = 0
	while (size >= 1024 && exp < units.length - 1) {
		size /= 1024
		exp++
	}
	
	return Number(size.toFixed(2)) + " " + units[exp]
}

export function generatePathTitle(path: string) {
	const pathSegments = path.split("/")
	pathSegments.shift() // remove leading empty segment
	const segments = pathSegments.map((segment, index) => {
		const segmentPath = "/" + pathSegments.slice(0, index + 1).join("/")
		return `<a href="${sanitizeURL(segmentPath)}">${sanitizeHtml(segment)}</a>`
	})

	return `<h1 id="path">/${segments.join("/")}</h1>`
}

export async function getProjectMeta() {
	const packageJsonRaw = await fs.readFile("package.json", "utf-8").catch(() => "{}")
	const packageJson = JSON.parse(packageJsonRaw)
	const commit = await getLastCommitHash()

	return { packageJson, commit }
}

async function getLastCommitHash(): Promise<string> {
	try {
		const { stdout } = await execAsync("git rev-parse HEAD")
		return stdout.trim()
	} catch (error) {
		printErrorInfo("Error retrieving the current git commit hash:", error as Error)
		console.log("Git must be installed, in PATH, and the current directory must be a valid git repository.")
		console.log("Try: `which git`, `ls -a`")
		process.exit(1)
	}
}

export function printErrorInfo(message: string, error: Error) {
	const errorInfo = { ...error }
	console.error(message, error.message, errorInfo)
}

export function sanitizeHtml(text: string) {
	return text.replace(/&/g, "&amp;")
				 .replace(/</g, "&lt;")
				 .replace(/>/g, "&gt;")
				 .replace(/"/g, "&quot;")
				 .replace(/'/g, "&#039;")
}

export function sanitizeURL(text: string) {
	return sanitizeHtml(encodeURI(text))
}

export function isDotFile(path: string) {
	return basename(path).startsWith(".")
}

function accesslistEntryToRegex(entry: string, strict: boolean): RegExp {
	if (entry.endsWith("*")) {
		entry = entry.slice(0, -1)
		strict = false
	}

	const escaped = entry
		.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
		.replace(/\*/g, ".+")

	if (!strict) {
		// Match the pattern, and allow extra path after the matched part
		return new RegExp(`^${escaped}.*$`)
	} else {
		// Match the pattern exactly
		return new RegExp(`^${escaped}$`)
	}
}

export function isInDenylist(path: string) {
	return config.denylist.some(entry => {
		if (!entry.includes("*")) {
			return path.startsWith(entry)
		}

		return accesslistEntryToRegex(entry, false).test(path)
	})
}

export function isInAllowlist(path: string) {
	if (config.allowlist == null) return true // if allowlist is null, allow everything not in denylist
	if (path == "/") return true // always allow root path

	path = normalizePath(path)

	return config.allowlist.some(entry => {
		if (!entry.includes("*")) {
			return path == entry
		}

		return accesslistEntryToRegex(entry, true).test(path)
	})
}

// normalize path with node:path and ensure it starts with "/" and does not end with "/"
export function normalizePath(path: string) {
	path = normalize(path)
	
	if (!path.startsWith("/")) {
		path = "/" + path
	}

	if (path.endsWith("/")) {
		return path.slice(0, -1)
	}

	return path
}
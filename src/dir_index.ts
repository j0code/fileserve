import type { Dirent } from "node:fs"
import type { Request, Response } from "express"
import fs from "node:fs/promises"
import { extname } from "node:path"
import mime from "mime"

const css = await fs.readFile("dir_index.css", { encoding: "utf-8"}).catch(() => "")

export async function dirIndex(req: Request, res: Response, basePath: string) {
	const path = req.url
	let entries: Dirent[] = []

	try {
		entries = await fs.readdir(basePath + path, { withFileTypes: true })
	} catch(e) {
		entries = []
	}

	let body = `<html><head><style>${css}</style></head><body>`
	body += `<h1>${generatePathTitle(path)}</h1><hr>`
	body += "<table>"
	body += `<thead></tr><th>Name</th><th>MIME</th><th>Size</th><th>Modified</th><th>Changed</th><th>Accessed</th><th>Created</th></tr></thead>`
	body += "<tbody>"
	if(path != "/") body += `<tr><td><a href="${path + ".."}">../</a></td><td>(go up)</td></tr><tr></tr>`

	for(let entry of entries) {
		let name = entry.name
		let displayName: string
		let targetPath: string
		let type = ""
		let className  = ""
		const stats = await fs.stat(basePath + path + name).catch(() => null)

		if (entry.isDirectory()) {
			name += "/"
			type = "dir"
		} else if (entry.isBlockDevice()) {
			type = "block-device"
		} else if (entry.isCharacterDevice()) {
			type = "character-device"
		} else if (entry.isFIFO()) {
			type = "fifo-pipe"
		} else if (entry.isSocket()) {
			type = "socket"
		} else if (entry.isSymbolicLink()) {
			type = "symlink"
			let resolved = await fs.readlink(basePath + path + name).catch(() => null)
			if (stats?.isDirectory()) {
				name += "/"
				resolved += "/"
			}
			if (resolved) {
				displayName = `${name} -> ${resolved}`
				targetPath = resolved
			}
		} else if (extname(name)) {
			const ext = name.split(".").pop()!
			type = mime.getType(ext) ?? "unknown"
		} else {
			type = "???" // TODO: make meaningful
		}

		if (type) {
			className = type.replaceAll("/", "-")
			if(type.startsWith("application")) className += " code"
		}

		targetPath  ??= path + name
		displayName ??= name

		body += `<tr><td><a href="${targetPath}" class="${className}">${displayName}</a></td><td>${type || ""}</td>`
		if (stats && entry.isFile()) {
			body += `<td>${formatSize(stats.size)}</td>`
		} else {
			body += `<td>-</td>`
		}
		body += `<td>${stats?.mtime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.ctime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.atime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.birthtime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += "</tbody></tr>"
	}

	body += "</table>"
	body += "</body></html>"
	res.set("Content-Type", "text/html")
	res.set("Access-Control-Allow-Origin", "*")
	res.set("Referrer-Policy", "same-origin")
	res.set("Cache-Control", "no-cache")
	res.set("X-Content-Type-Options", "nosniff")
	res.end(body)
}

function formatSize(size: number) {
	const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
	let exp = 0
	while (size >= 1024 && exp < units.length - 1) {
		size /= 1024
		exp++
	}
	
	return Number(size.toFixed(2)) + " " + units[exp]
}

function generatePathTitle(path: string) {
	const pathSegments = path.split("/")
	pathSegments.shift() // remove leading empty segment
	const segments = pathSegments.map((segment, index) => {
		const segmentPath = "/" + pathSegments.slice(0, index + 1).join("/")
		return `<a href="${segmentPath}">${segment}</a>`
	})

	return `<h1 id="path">/${segments.join("/")}</h1>`
}
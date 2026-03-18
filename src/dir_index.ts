import type { Dirent } from "node:fs"
import type { Request, Response } from "express"
import fs from "node:fs/promises"
import { extname, join } from "node:path/posix"
import mime from "mime"
import { sanitizeHtml, sanitizeURL, formatSize, generatePathTitle, getProjectMeta } from "./util.js"

const projectMeta = await getProjectMeta()

const css    = await fs.readFile("dir_index.css",    { encoding: "utf-8"}).catch(() => "")
const js	 = await fs.readFile("dist/frontend.js", { encoding: "utf-8"}).catch(() => "")
const footer = await generateFooter()

export async function dirIndex(req: Request, res: Response, basePath: string) {
	const path = req.url
	const fullPath = join(basePath, req.url)
	let entries: Dirent[] = []

	try {
		entries = await fs.readdir(fullPath, { withFileTypes: true })
	} catch(e) {
		entries = []
	}

	let body = `<html><head><style>${css}</style><script type="module">${js}</script></head><body>`
	body += `<header>${generatePathTitle(path)}</header><hr>`
	body += `<main><table id="dir-index">`
	body += `<thead></tr><th>Name</th><th>MIME</th><th>Size</th><th>Modified</th><th>Changed</th><th>Accessed</th><th>Created</th></tr></thead>`
	body += "<tbody>"
	if(path != "/") body += `<tr><td><a href="${sanitizeURL(path + "..")}">../</a></td><td>(go up)</td></tr><tr></tr>`

	for(let entry of entries) {
		let name = entry.name
		let displayName: string
		let targetPath: string
		let type = ""
		let className  = ""
		const entryPath = join(fullPath, name)
		const stats = await fs.stat(entryPath).catch(() => null)

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
			let resolved = await fs.readlink(entryPath).catch(() => null)
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

		targetPath  ??= join(path, name)
		displayName ??= name

		body += `<tr><td><a href="${sanitizeURL(targetPath)}" class="${sanitizeHtml(className)}">${sanitizeHtml(displayName)}</a></td><td>${sanitizeHtml(type || "")}</td>`
		if (stats && entry.isFile()) {
			body += `<td>${formatSize(stats.size)}</td>`
		} else {
			body += `<td>-</td>`
		}
		body += `<td>${stats?.mtime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.ctime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.atime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += `<td>${stats?.birthtime.toISOString().replace("T", " ").substring(0, 19) ?? ""}</td>`
		body += "</tr>"
	}

	body += "</tbody></table></main><hr>"
	body += footer
	body += "</body></html>"
	res.set("Content-Type", "text/html")
	res.set("Access-Control-Allow-Origin", "*")
	res.set("Referrer-Policy", "same-origin")
	res.set("Cache-Control", "no-cache")
	res.set("X-Content-Type-Options", "nosniff")
	res.end(body)
}

async function generateFooter() {
	const { packageJson, commit } = projectMeta
	const name     = packageJson.name     || "unknown"
	const version  = packageJson.version  || "unknown"
	const author   = packageJson.author   || "unknown"
	const homepage = packageJson.homepage || "#"
	const authorPage = `https://github.com/${author}`
	const homepageURL = new URL(homepage)
	const githubBase = homepageURL.origin + homepageURL.pathname
	const commitURL  = `${githubBase}/commit/${commit}`
	const commitShort = commit.substring(0, 8)

	let footer = "<footer>"
	
	footer += `<div id="project-info" title="♥ GPL-3.0-or-later licenced ♥"><a href="${sanitizeURL(packageJson.homepage)}">${sanitizeHtml(name)} v${sanitizeHtml(version)}</a></div>`
	footer += `<div id="credits"><code>&lt;/&gt;</code> with ♥ by <a href="${sanitizeURL(authorPage)}">j0code</a></div>`
	footer += `<div id="commit"><a href="${sanitizeURL(commitURL)}">commit: ${sanitizeHtml(commitShort)}</a></div>`

	footer += "</footer>"
	return footer
}
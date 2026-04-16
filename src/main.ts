import express, { type Response } from "express"
import { dirIndex } from "./dir_index.js"
import fs from "node:fs/promises"
import { isPathAllowed, printErrorInfo } from "./util.js"
import path from "node:path/posix"
import config from "./config.js"

const app  = express()

if(process.argv[2] == "--help") {
	console.error("Syntax: node . <path>\npath - the path to serve as web root")
	process.exit(0)
}


// Normalize path to prevent directory traversal attacks and ensure consistent behavior
app.use((req, res, next) => {
	const reqUrl = encodeURI(decodeURIComponent(req.url)) // clean up over-encoding (e.g. %2F -> /)
	const normalizedPath = path.normalize(reqUrl)

	if (normalizedPath != req.url) {
		res.redirect(301, normalizedPath)
		return
	}

	next()
})

app.use((req, res, next) => {
	const fullPath = path.join(config.basePath, req.url)

	if (!isPathAllowed(fullPath)) {
		res.status(404).end()// pretend it doesn't exist
		return
	}

	next()
})

app.use(express.static(config.basePath, {
	setHeaders: (res, path, stat) => {
		res.set("Access-Control-Allow-Origin", "*")
		res.set("Referrer-Policy", "same-origin")
		res.set("Cache-Control", "no-cache")
		res.set("X-Content-Type-Options", "nosniff")
	}
}))

// directory view
app.use(async (req, res) => {
	const fullPath = path.join(config.basePath, req.url)
	if (!fullPath.startsWith(config.basePath)) { // should never happen due to normalization, but just in case
		res.status(403).end() // prevent directory traversal attacks
		return
	}

	const stats = await fs.stat(fullPath).catch(() => null)

	if (!stats) {
		res.status(404).end() // TODO: custom 404 page
		return
	}

	// express.static skips if file type is unknown, so we handle it here
	if (stats.isFile()) {
		serveUnknownFile(fullPath, res)
		return
	}

	if (stats.isDirectory()) {
		if (!fullPath.endsWith("/")) {
			res.redirect(req.url + "/")
			return
		}
		if (config.exposeIndex) {
			dirIndex(req, res, config.basePath)
		} else {
			res.status(404).end() // TODO: custom 404 page
		}
		return
	}

	res.status(500).end() // TODO: proper error handling for fifo pipes, sockets, etc.
})

app.listen(config.port, (error) => {
	if (error) {
		if ("code" in error && error.code == "EACCES") {
			console.error(`Must be run as root to bind to port ${config.port}.`)
		} else {
			printErrorInfo("Failed to start server:", error)
		}
		return
	}

	console.info("Server running on port", config.port, "; path:", config.basePath)
})

async function serveUnknownFile(path: string, res: Response) {
	res.set("Content-Type", "text/plain")
	res.set("Access-Control-Allow-Origin", "*")
	res.set("Referrer-Policy", "same-origin")
	res.set("Cache-Control", "no-cache")
	res.set("X-Content-Type-Options", "nosniff")

	const stream = await fs.open(path, "r").then(fileHandle => {
		const readStream = fileHandle.createReadStream()
		readStream.on("end", () => {
			fileHandle.close()
		})
		return readStream
	}).catch(() => {
		res.status(500).end()
	})

	if (!stream) {
		res.status(500).end()
		return
	}

	stream.pipe(res)
}
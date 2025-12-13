import express, { type Response } from "express"
import { dirIndex } from "./dir_index.js"
import fs from "node:fs/promises"

const app  = express()
const port = 80
const basePath = process.argv[2] || "/"

if(basePath == "--help") {
	console.error("Syntax: node . <path>\npath - the path to serve as web root")
	process.exit(0)
}

app.use(express.static(basePath, {
	setHeaders: (res, path, stat) => {
		res.set("Access-Control-Allow-Origin", "*")
		res.set("Referrer-Policy", "same-origin")
		res.set("Cache-Control", "no-cache")
		res.set("X-Content-Type-Options", "nosniff")
	}
}))

// directory view
app.use(async (req, res) => {
	const stats = await fs.stat(req.url).catch(() => null)

	if (!stats) {
		res.status(404).end() // TODO: custom 404 page
		return
	}

	// express.static skips if file type is unknown, so we handle it here
	if (stats.isFile()) {
		serveUnknownFile(basePath + req.url, res)
		return
	}

	if (stats.isDirectory()) {
		dirIndex(req, res, basePath)
		return
	}

	res.status(500).end() // TODO: proper error handling for fifo pipes, sockets, etc.
})

app.listen(port, () => {
	console.log("Server running on port", port, "; path:", basePath)
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
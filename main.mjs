import express from "express"
import fs from "fs/promises"
import mime from "mime"

const app  = express()
const port = 80
const path = process.argv[2] || "/"

if(path == "--help") {
	console.error("Syntax: node . <path>\npath - the path to serve as web root")
	process.kill(0)
}

app.use(express.static(path, {
	setHeaders: (res, path, stat) => {
		res.set("Access-Control-Allow-Origin", "*")
		res.set("Referrer-Policy", "same-origin")
		res.set("Cache-Control", "no-cache")
		res.set("X-Content-Type-Options", "nosniff")
	}
}))

// directory view
app.use(async (req, res) => {
	let p = req.url
	let files = []

	try {
		files = await fs.readdir(path + p)
	} catch(e) {
		files = []
	}

	let body = "<html><head><style>body{background-color:#222222;color:#e0e0e0}a{color:#e0e0e0;text-decoration:none}.code{font-family:monospace}.text-html{color: lime}thead{font-weight:bold}</style></head><body>"
	body += `<h1>${p}</h1><hr>`
	body += "<table>"
	body += `<thead></tr><td>File</td><td>MIME</td></tr></thead>`
	if(p != "/") body += `<tr><td><a href="${p + ".."}">../</a></td><td>(go up)</td></tr><tr></tr>`

	for(let f of files) {
		let type = ""
		let cls  = ""
		if(f.substr(1).includes(".")) {
			let ext  = f.split(".").pop()
			type = mime.getType(ext)
		} else {
			f += "/"
			type = "dir"
		}

		if(type) {
			cls = type.replaceAll("/", "-")
			if(type.startsWith("application")) cls += " code"
		}

		body += `<tr><td><a href="${p + f}" class="${cls}">${f}</a></td><td>${type || ""}</td></tr>`
	}

	body += "</table>"
	body += "</body></html>"
	res.set("Content-Type", "text/html")
	res.set("Access-Control-Allow-Origin", "*")
	res.set("Referrer-Policy", "same-origin")
	res.set("Cache-Control", "no-cache")
	res.set("X-Content-Type-Options", "nosniff")
	res.end(body)
})

app.listen(port, () => {
	console.log("Server running on port", port, "; path:", path)
})

import fs from "node:fs/promises"

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
		return `<a href="${segmentPath}">${segment}</a>`
	})

	return `<h1 id="path">/${segments.join("/")}</h1>`
}

export async function getProjectMeta() {
	const packageJsonRaw = await fs.readFile("package.json", "utf-8").catch(() => "{}")
	const packageJson = JSON.parse(packageJsonRaw)

	// NOTE: This assumes a standard git setup; may not work in all cases
	const commit = await fs.readFile(".git/HEAD", "utf-8").then(async ref => {
		if (ref.startsWith("ref: ")) {
			const refPath = ".git/" + ref.substring(5).trim()
			return fs.readFile(refPath, "utf-8").then(hash => hash.trim()).catch(() => null)
		} else {
			return ref.trim()
		}
	}).catch(() => null) ?? "unknown"

	return { packageJson, commit }
}
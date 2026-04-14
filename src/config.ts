import YSON from "@j0code/yson"
import { checkBoolean, checkPort, checkString, checkStringArray, type Config } from "./types.js"
import defaultConfig from "./defaultConfig.js"
import { normalizeAccesslistEntry, normalizePath } from "./util.js"

const configFile = await(async () => {
	try {
		return await YSON.load("./config.yson")
	} catch (e) {
		if (e instanceof Error && "code" in e && e.code == "ENOENT") {
			console.info("Config file not found, using default config.")
			return {} as Record<string, unknown>
		}
		console.error("Failed to load config file:", e)
		process.exit(1)
	}
})()

if (typeof configFile != "object" || configFile == null || Array.isArray(configFile)) {
	console.error("Invalid config file: must be an object")
	process.exit(1)
}

const basePath = process.argv[2] ?? configFile.basePath ?? defaultConfig.basePath
checkString(basePath, "basePath")

const port = Number(configFile.port ?? defaultConfig.port)
checkPort(port, "port")

const exposeIndex = configFile.exposeIndex ?? defaultConfig.exposeIndex
checkBoolean(exposeIndex, "exposeIndex")

const exposeHidden = configFile.exposeHidden ?? defaultConfig.exposeHidden
checkBoolean(exposeHidden, "exposeHidden")

const denylist = configFile.denylist ?? defaultConfig.denylist
checkStringArray(denylist, "denylist")

const allowlist = configFile.allowlist ?? defaultConfig.allowlist
checkStringArray(allowlist, "allowlist", true)

const config = {
	basePath: normalizePath(basePath),
	port,
	exposeIndex,
	exposeHidden,
	denylist: normalizePaths(denylist),
	allowlist: allowlist ? normalizePaths(allowlist) : null
} satisfies Config

export default config

function normalizePaths(paths: string[]) {
	return paths.map(path => normalizeAccesslistEntry(path, basePath as string))
}

console.log("Config loaded:", config)
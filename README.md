# fileserve

## What does it do?
fileserve is an alternative for file:// that
- allows cors
- allows loading module scripts
- prevents content type sniffing
- serves index.html (if exists) for directories

It serves `/` if not told otherwise.

> [!CAUTION]
> Use as a webserver with caution. Connections are never encrypted!  
> See [Security Considerations](#security-considerations) for more.
> 
> Do not use while connected to a public network (unless using as a webserver)! Everyone in your local network can access your files!

## How to use?
1. Download it (green "Code" button > clone it)
2. Run it
```sh
node . <path>
```
- path - the path to serve as root directory (optional; default: /)
3. You can now access it at http://localhost/ (port as set in [Config](#config))

> [!NOTE]
> Note that you might need sudo because it tries to bind to port 80 by default.  
> Do not download as a ZIP; it won't work!

## Config
See default config in [defaultConfig.ts](./src/defaultConfig.ts).  
To override the default config, do NOT edit defaultConfig.ts directly.  
Instead, use one of the following:

### Config file
Create a file called `config.yson` in the root directory of this repository.  
See [@j0code/yson](https://github.com/j0code/yson) for syntax. It's a superset of JSON.  
All fields are optional. When omitted, the default config option is kept.  
Example:
```js
{
	basePath: "/home/user/coding/projectxy",
	allowlist: [
		"^",
		"^/*"
	]
}
```

### Command line option
As explained above, the syntax for running this project is:
```sh
node . <path>
```
This can be used to override basePath.  
The command line option takes precedence over the config file.

### Config options
- **basePath** (string)  
path served as root directory  
default: `"/"`
- **port** (number from 1 to 65535)  
port the web server runs under  
default: `80`
- **exposeIndex** (boolean)  
Whether or not dir indexes should be served for directories with no index.html.  
default: `true`
- **exposeHidden** (boolean)  
Whether or not dotfiles and directories (file name starts with `.`, like `.ssh`) should be served.  
This does not prevent files within such directories from being served.  
default: `true`
- **denylist** (array of strings)  
list of paths not to serve  
All files and directories within listed directories are also denied. E.g. `/usr` includes `/usr/bin`.  
Automatically includes all files and directories outside of basePath.  
Also see [glob patterns](#glob-patterns).  
default: see [defaultConfig.ts](./src/defaultConfig.ts)
- **allowlist** (array of strings or null)  
\- if null: allowlist is disabled  
\- if array of strings: list of paths to be served  
When disabled, all paths not excluded by denylist or exposeHidden options are served.  
When enabled, automatically includes basePath, but not files and directories within it.  
Does not allow files and directories within listed directories. E.g. `/home/user` does not include `/home/user/Desktop`.  
Also see [glob patterns](#glob-patterns).  
default: `null` (disabled)

> [!NOTE]
> When a path is captured by both `denylist` and `allowlist`, it is not served.  
> The same applies to `exposeHidden`. If it is true, all files and directories whose names start with `.` are not served, even if explicitly included in `allowlist`. 

### Glob Patterns
This applies to `denylist` and `allowlist` options.

fileserve supports wildcards (`*`).  
Examples:
```
/usr/bin/*      - all files and directories within /usr/bin (but not /usr/bin itself!)
/home/*/Desktop - Desktops of all users.
```

Difference between `denylist` and `allowlist`:
```md
# denylist
/usr   - /usr and all files and directories within it
/usr/* - all files and directories within /usr but not itself

# allowlist
/usr   - just /usr
/usr/* - all files and directories within /usr but not iself
```
This is to ensure only paths you explicitly want allowed are exposed while denied directories are denied all at once.

fileserve also supports `^` as a shorthand for the basePath.  
This works with and without and following slash (`/`).
```js
{
	basePath: "/hello/world",
	allowlist: [
		"^/js/*", // resolved to "/hello/world/js/*"
		"^css/*"  // resolved to "/hello/world/css/*"
	]
}
```

## Supported Systems
Tested and working on:
- v1.1
  - Ubuntu 24.04.4 x86-64 (GNOME 46, Wayland)
- 1.0
  - Ubuntu 20.04.4 x86-64 (GNOME 3.26.8, X11)

Should also work:
- any Linux system
- any MacOS system
- any Windows system

Report compatibility issues in the [Issues](https://github.com/j0code/fileserve/issues) tab.  
Report compatible system configurations via Discord.  
See [Contributing](#contributing) for more.

## Security Considerations
When running as a public webserver, you should consider:
- enabling the allowlist
- hiding dotfiles and disabling the directory index
- not exposing fileserve directly to the internet, put it behind a secure reverse proxy
- using a basePath that only contains the files you want to serve (a webroot)

For that, create a [config file](#config-file) with the following contents:
```js
{
	basePath: "/var/www/html", // or whereever your website files are stored
	port: 81, // or any other port (so the reverse proxy can run on port 80)
	exposeIndex: false,
	exposeHidden: false,
	allowlist: [ // only serve public files and directories
		"^/*" // all files and directories within basePath
	]
}
```

## Contributing
If you got any feature requests, found any bugs or want to point out anything else related to the code,
you can do so in the [Issues](https://github.com/j0code/fileserve/issues) tab.

If you got any questions or can confirm that the code works on other OSes, tell me on Discord: [@j0code](https://discord.com/users/418109742183874560)

In either case, please include:
- OS name (Windows, Mac OS, Ubuntu, ArchLinux, etc.)
- OS version
- Processor architecture (x86-64, x86-64, arm64, etc.)

In case of Linux systems, please also include:
- Desktop name (GNOME, KDE, etc.)
- Desktop version
- Windowing system (X11, Wayland, etc.) *(optional)*

## Credits
- [express.js](https://expressjs.com/)
- [mime](https://github.com/broofa/mime#readme)
- [temporal-spec](https://github.com/fullcalendar/temporal-polyfill#readme) (temporary)
- [@j0code/yson](https://github.com/j0code/node-yson#readme)
- [typescript](https://www.typescriptlang.org/)

# fileserve

### What does it do?
fileserver is an alternative for file:// that allows cors.

It serves / if not told otherwise.

> Do not use this as a webserver. It is not protected against path traversal and connections are never encrypted!

### How to use?
1. Download it (green "Code" button > Download ZIP, or clone it)
2. Run it
```sh
node . <path>
```
- path - the path to serve as root directory (optional; default: /)
> Note that you might need sudo because it tries to bind to port 80
3. You can now access it at http://localhost/ (port 80)

## Supported OSes
Tested and working on:
- Ubuntu 20.04.4 x64 (GNOME 3.26.8, X11)

Should also work:
- any Linux system
- any MacOS system
- any Windows system

## Feature Requests, Bugs & Other Issues
If you got any feature requests, found any bugs or want to point out anything else related to the code,
you can do so in the [Issues](https://github.com/j0code/fileserve/issues) tab.

If you got any questions or can confirm that the code works on other OSes, tell me on Discord: [j0code#7360](https://discord.com/users/418109742183874560)

## Credits
- [express.js](https://expressjs.com/)
- [mime](https://github.com/broofa/mime)

# Workspaces-first Paseo

This fork adds the workspace workflow used by `lilfeelz/workspaces` as a first-party Paseo plugin.
The Workspaces sidebar item reads workspace names and active zmx sessions through `ws list`, resolves
their canonical directories through `ws dir`, then opens that directory in Paseo and starts
`ws surface <directory>` in its terminal. `ws` remains the source of truth for workspace names and
directories; zmx remains the source of truth for persistent panes.

The fork keeps Paseo's existing daemon, clients, and end-to-end encrypted relay. Relay enablement
and device pairing are managed by Paseo; the workspace plugin sends its RPCs over the connected
Paseo session. It does not add a second network service or store communication credentials.

## Requirements

- Run the daemon on the machine that has the `workspaces` checkout and `ws` installed.
- Make `ws` available at `~/.local/bin/ws` or on the daemon `PATH`, or set `WS_BIN` to its absolute
  path.
- For mobile access, enable Paseo relay and pair the client with the daemon using the normal Paseo
  pairing flow.

## Development

Run the workspace-first client with:

```sh
npm run dev:app:workspaces
```

This opens the Workspaces screen after host startup and keeps only its sidebar entry, Hosts, and
Settings. Use Hosts to pair a daemon and Settings to change connection preferences. The standard
Paseo client remains available through `npm run dev:app`.

```sh
npm ci
npm run build:client
npm run build:plugin
npm run build --workspace=@getpaseo/highlight
npm run dev:server
```

The built-in plugin is registered in `packages/server/src/server/plugins/builtin/index.ts` and its
source is under `plugins/workspaces-bridge/`. It is included in the daemon's built-in plugin catalog
without installing or enabling a local plugin. Its backend invokes only `ws list` and `ws dir` with
argument arrays; the terminal command is separately created by the Paseo client API.

The workspace-first mode narrows the client navigation and startup view. Paseo's upstream server
and app modules remain in the build, so direct links to other supported screens still work.

## Source and integration ledger

This is a fork of `getpaseo/paseo`, not a clean-room rewrite. The fork retains the upstream Apache-2.0
license, copyright notices, dependency tree, and attribution. The feature branch starts at upstream
commit `068f272a0`; the minimal workspace screen and client mode are commits `a612bb6b5` and
`9fef1c9c5`.

| Source                                                                | Retained or added                                        | Purpose                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/relay/`, `packages/protocol/`, host pairing and daemon auth | Retained from Paseo                                      | Encrypted remote client-to-host communication and session protocol           |
| `packages/server/`                                                    | Retained from Paseo, with a built-in plugin registration | Host daemon, RPC transport, workspace bridge execution                       |
| `packages/app/`                                                       | Retained with workspace-only startup and navigation mode | Workspaces client UI; connection and settings screens remain available       |
| `packages/desktop/`                                                   | Retained with an optional branded build identity         | Standalone macOS wrapper for the installable example                         |
| `plugins/workspaces-bridge/`                                          | Added to the Paseo fork                                  | Calls the existing `ws` CLI to list/resolve workspaces and open `ws surface` |
| `workspaces/paseo/` in `lilfeelz/workspaces`                          | Companion integration, not copied into Paseo             | Installable local plugin for an unmodified Paseo daemon                      |

No workspace database, naming rules, pane manager, or second communication service was scraped or
reimplemented. `ws` owns names and paths; zmx owns persistent panes; Paseo owns pairing, credentials,
and encrypted relay. The bridge is trusted host-side plugin code and can access the daemon user's
workspaces. The UI mode hides most Paseo navigation but leaves upstream modules compiled in the app.

## Installable macOS example

The arm64 build is produced by the `Paseo Workspaces desktop` GitHub Actions workflow on a macOS
runner after pushing a `paseo-workspaces-build-*` tag and uploaded as a short-lived artifact. It is unsigned and unnotarized; macOS may require
opening it from Finder's context menu. The app name, bundle ID, external URL scheme, and Electron
user-data directory are separate from Paseo (`Paseo Workspaces`, `org.lilfeelz.paseo-workspaces`,
`paseows`, and `~/Library/Application Support/Paseo Workspaces`) so it can be installed side-by-side.
Its bundled renderer uses the compatible `paseo://app` origin to connect to existing Paseo daemons,
while `paseows` links open this app. It uses Paseo's normal `~/.paseo` daemon home unless
`PASEO_HOME` is configured, so it can reuse the existing host daemon without starting a second one
on the same port.

To install manually, download the `paseo-workspaces-macos-arm64` artifact, open the DMG, and drag
`Paseo Workspaces.app` to Applications. On book, keep the existing Paseo app. Pair this app through
Paseo's normal Hosts flow to the daemon that has `ws` installed. The relay sends encrypted Paseo
session data; the workspace plugin itself executes on the paired host.

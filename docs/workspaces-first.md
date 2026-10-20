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

# Textile Desktop _(desktop)_

[![Made by Textile](https://img.shields.io/badge/made%20by-Textile-informational.svg?style=popout-square)](https://textile.io)
[![Chat on Slack](https://img.shields.io/badge/slack-slack.textile.io-informational.svg?style=popout-square)](https://slack.textile.io)
[![Keywords](https://img.shields.io/github/package-json/keywords/textileio/desktop.svg?style=popout-square)](./package.json)

[![GitHub package.json version](https://img.shields.io/github/package-json/v/textileio/desktop.svg?style=popout-square)](./package.json)
[![GitHub license](https://img.shields.io/github/license/textileio/desktop.svg?style=popout-square)](./LICENSE)
[![David](https://img.shields.io/david/dev/textileio/desktop.svg)](https://david-dm.org/textileio/desktop)
[![CircleCI branch](https://img.shields.io/circleci/project/github/textileio/desktop/master.svg?style=popout-square)](https://circleci.com/gh/textileio/desktop)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=popout-square)](https://github.com/RichardLitt/standard-readme)

> Official Textile Desktop Tray App

Join us on our [public Slack channel](https://slack.textile.io/) for news, discussions, and status updates. For current status, and where you can help, please see our [issues](https://github.com/textileio/desktop/issues).

## Table of Contents

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Background](#background)
- [Development](#development)
- [Documentation](#documentation)
- [Maintainer](#maintainer)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)
<!-- AUTO-GENERATED-CONTENT:END -->

## Background

[Textile](https://www.textile.io) provides encrypted, recoverable, schema-based, and cross-application data storage built on [IPFS](https://github.com/ipfs) and [libp2p](https://github.com/libp2p). We like to think of it as a decentralized data wallet with built-in protocols for sharing and recovery, or more simply, **an open and programmable iCloud**.

The reference implementation of Textile is [written in Go](https://github.com/textileio/go-textile), and can be compiled to various platforms, including mobile (Android/iOS) and desktop/server (OSX, Windows, Linux, etc). The app in this repo is designed to help support things like browser-based Textile apps, Node.js apps, and other use-cases.

This app provides access to an underlying `go-textile` node's REST API, and comes with various user-interfaces to access, control, and otherwise monitor API access. It is a testing ground for developing new services and tools on top of Textile for desktop environments.

## Development

This project was bootstrapped with Textile's [`textile-react-cookie`](https://github.com/textileio/textile-react-cookie). It was originally generated via [Create React App](https://github.com/facebook/create-react-app), and then the build/run configuration was customized with a `craco.config.js` file.

To start developing with Textile desktop, you'll need to install `go`, `nodejs`, and various standard build tools. Then you can:

**`yarn dev`**

Runs the app in the development mode. This will activate a vanilla Electron app in development mode. It will not support all Textile desktop functionality, but is a good way to play around with the UI.

**`yarn build`**

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

**`yarn dist`**

Builds the app and bundles it as an [Electron app](https://electronjs.org/), along with the underlying go-textile node. This is how you produce a true Textile desktop release. See `./scripts/bundle.sh` for the commands used, and the [`go-astilectron` + bundler](https://github.com/asticode/go-astilectron-bundler#installation) repos for details.

**Manual**

Install `go-astilectron-bundler`:

    go get github.com/asticode/go-astilectron-bundler/...
    go install github.com/asticode/go-astilectron-bundler/astilectron-bundler

Build the app:
    yarn build
    astilectron-bundler -v

Double-click the built app in `tray/output/{darwin,linux,windows}-amd64`, or run it directly:

    go run *.go

You can also build the architecture-specific versions with:

    astilectron-bundler -v -c bundler.{mac,linux,windows}.json

_**Linux**_

On Linux, you also have to `apt-get install libappindicator1 xclip libgconf-2-4` due to an issue with building Electron-based apps.

## Documentation

Coming soon...

## Maintainer

[Carson Farmer](https://github.com/carsonfarmer)

## Contributing

Textile's Desktop Tray App is a work in progress. As such, there's a few things you can do right now to help out:

  * Ask questions! We'll try to help. Be sure to drop a note (on the above issue) if there is anything you'd like to work on and we'll update the issue to let others know. Also [get in touch](https://slack.textile.io) on Slack.
  * Log bugs, [file issues](https://github.com/textileio/js-http-client/issues), submit pull requests!
  * **Perform code reviews**. More eyes will help a) speed the project along b) ensure quality and c) reduce possible future bugs.
  * Take a look at [go-textie](https://github.com/textileio/go-textile) (which is our reference implementation), and also at some of the client repositories: for instance [js-http-client](https://github.com/textileio/js-http-client).
  * Contributions here that would be most helpful are **top-level comments** about how it should look based on our understanding. Again, the more eyes the better.
  * **Add tests**. There can never be enough tests.
  * **Contribute to the [Textile WIKI](https://github.com/textileio/go-textile/wiki)** with any additions or questions you have about Textile and its various impmenentations. A good example would be asking, "What is a thread?". If you don't know a term, odds are someone else doesn't either. Eventually, we should have a good understanding of where we need to improve communications and teaching together to make Textile even better.

 Before you get started, be sure to read our [contributors guide](./CONTRIBUTING.md) and our [contributor covenant code of conduct](./CODE_OF_CONDUCT.md).

## Contributors
<!-- Update with yarn credit -->
<!-- ⛔️ AUTO-GENERATED-CONTENT:START (CONTRIBUTORS) -->
| **Commits** | **Contributor** |  
| --- | --- |  
| 23 | [carsonfarmer](https://github.com/carsonfarmer) |  

<!-- ⛔️ AUTO-GENERATED-CONTENT:END -->

## License

[MIT](./LICENSE)

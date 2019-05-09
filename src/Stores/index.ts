// tslint:disable: no-console
import { observe, action, observable, runInAction, computed } from 'mobx'
import textile, { Wallet } from '@textile/js-http-client'
import { createMemorySource, createHistory } from '@reach/router'
import moment, { utc } from 'moment'
const { remote } = window.require('electron')
import path from 'path'

const AVATAR_KEY = 'profile'
const DEFAULT_AVATAR = 'https://react.semantic-ui.com/images/wireframe/square-image.png'

export interface Message {
  name: string
  payload?: any
}

export type Screen = 'starting' | 'loading' | 'online' | 'error' | 'onboard' | 'landing'

const source = createMemorySource('/')
const history = createHistory(source)

// tslint:disable-next-line:no-empty-interface
export interface Store {}

export interface ProfileInfo {
  name: string
  avatar: string
  date: string
  address: string
}

export interface AppInfo {
  appId: string
  appName: string
  link: string
  hash: string
}

export interface AccountApps {
  [id: string]: AppInfo
}

export class AppStore implements Store {
  @computed get dataFolder() {
    const folder = path
      .join(remote.app.getPath('userData'), this.currentAddress)
      // Replace Electron in dev envs
      .replace('Electron', 'Textile')
    return folder
  }
  // Observables
  @observable history = history
  // TODO: Maybe this should just be strings and do the conversion in components?
  @observable addresses: string[] = []
  @observable error: string = ''
  @observable currentAddress: string = ''
  @observable threads: any[] = []
  @observable gateway = 'http://127.0.0.1:5050'
  @observable screen: Screen = 'starting'
  @observable cafes: any[] = []
  @observable notifications: any[] = []
  @observable apps: AccountApps = {}
  @observable profile?: ProfileInfo = undefined
  constructor() {
    textile.utils.online().then((online: boolean) => {
      if (online) {
        runInAction('constructor', () => {
          this.screen = 'online'
        })
      } else {
        runInAction('constructor', () => {
          this.error = 'offline'
        })
      }
    }).catch((err: Error) => {
      runInAction('constructor', () => {
        this.error = err.toString()
      })
    })
    observe(this, 'screen', (change) => {
      history.navigate(`/${change.newValue}`, { replace: false })
      switch (change.newValue) {
        case 'online':
          this.fetchProfile()
          this.fetchCafes()
          this.fetchNotifications()
          break
        default:
          break
      }
    })
    if ('astilectron' in window) {
      try {
        astilectron.onMessage((message: Message) => {
          const item = message.payload
          switch (message.name) {
            case 'addresses':
              runInAction('addresses', () => {
                this.addresses = item
              })
              this.screen = (item && item.length > 0) ? 'landing' : 'onboard'
              break
            case 'app-update':
              item.link = (item.link)
                ? item.link : `${this.gateway}/ipfs/${item.hash}`
              runInAction('app-update', () => {
                this.apps[item.appId] = item
              })
              break
            case 'notification':
              item.user.avatar = (item.user.avatar)
                ? `${this.gateway}/ipfs/${item.user.avatar}/0/small/d`
                : item.user.avatar = DEFAULT_AVATAR
              runInAction('notification', () => {
                this.notifications.unshift(item)
              })
              const isMessage = item.type === 'MESSAGE_ADDED'
              const opts: NotificationOptions = {
                icon: item.user.avatar,
                body: `${item.user.name} ${isMessage ? 'said: ' : ''}${item.body} `,
                timestamp: moment(item.date).unix()
              }
              const note = new Notification(item.subject_desc, opts)
              break
            default:
              console.log(message)
          }
        })

      } catch (err) {
        console.log('message handler already defined')
      }
    }
  }
  // Methods
  createMnemonic(): string {
    return Wallet.fromWordCount(12).recoveryPhrase
  }
  async sendMessage(message: Message): Promise<Message> {
    message.payload = message.payload !== undefined ? message.payload : {}
    return new Promise((resolve) => {
      // TODO: Catch if astilectron doesn't exist
      astilectron.sendMessage(message, (response: Message) => {
        resolve(response)
      })
    })
  }
  // Actions
  @action async initAndStartTextile(mnemonic?: string, address?: string, password?: string) {
    let screen: Screen = 'loading'
    if ('astilectron' in window) {
      try {
        this.error = 'loading'
        const response = await this.sendMessage({
          name: 'init',
          payload: { mnemonic, address, password }
        })
        if (response && response.payload) {
          screen = 'error'
          runInAction('initAndStartTextile', () => {
            // TODO: Move this to go side of things?
            const passError = 'file is not a database'
            this.error = response.payload === passError ?
              'unable to decrypt db (invalid password?)' :
              response.payload
          })
        } else {
          await this.fetchAddress()
          runInAction('initAndStartTextile', () => {
            this.error = ''
            this.screen = 'online'
          })
        }
      } catch (err) {
        this.screen = 'online'
      }
    } else {
      // Do nothing (we're probably in dev mode?)
      this.screen = 'online'
    }
  }
  @action async fetchAddress() {
    try {
      this.currentAddress = await textile.account.address()
    } catch (err) {
      console.log(err)
    }
  }
  @action async fetchMessages() {
    try {
      const success = await textile.cafes.checkMessages()
    } catch (err) {
      console.log(err)
    }
  }
  @action async fetchProfile() {
    try {
      const contact = await textile.account.contact()
      let updated: string | undefined
      for (const peer of contact.peers) {
        if (moment(peer.updated).isAfter(moment(updated))) {
          updated = peer.updated
        }
      }
      runInAction('fetchProfile', () => {
        this.profile = {
          name: contact.name ? contact.name : contact.address.slice(-8),
          address: contact.address,
          avatar: contact.avatar ? `${this.gateway}/ipfs/${contact.avatar}/0/large/d` : DEFAULT_AVATAR,
          date: updated || utc().format()
        }
      })
    } catch (err) {
      console.log(err)
    }
  }
  @action async fetchNotifications() {
    try {
      const notifications = await textile.notifications.list()
      const processed = notifications.items.map((item) => {
        item.user.avatar = item.user.avatar
          ? `${this.gateway}/ipfs/${item.user.avatar}/0/small/d`
          : DEFAULT_AVATAR
        return item
      })
      runInAction('fetchNotifications', () => {
        this.notifications = processed
      })
    } catch (err) {
      console.log(err)
    }
  }
  @action async readNotification(id: string) {
    try {
      const success = await textile.notifications.read(id)
      if (success) {
        this.fetchNotifications()
      }
    } catch (err) {
      console.log(err)
    }
  }
  @action async fetchThreads() {
    try {
      const threads = await textile.threads.list()
      runInAction('fetchThreads', () => {
        this.threads = threads.items
      })
    } catch (err) {
      console.log(err)
    }
  }
  @action async fetchCafes() {
    try {
      const cafes = await textile.cafes.list()
      runInAction('fetchCafes', () => {
        this.cafes = cafes.items
      })
    } catch (err) {
      console.log(err)
    }
  }
  @action async syncAccount() {
    textile.account.sync(true)
      .then((stream: ReadableStream) => {
        const reader = stream.getReader()
        reader.read().then((item: any) => {
          const opts: NotificationOptions = {
            body: item.id,
            timestamp: moment().unix()
          }
          const note = new Notification('Found and applying snapshot', opts)
        })
      })
  }
  @action async setProfile(userString?: string, avatarFile?: FormData) {
    if (userString) {
      await textile.profile.setName(userString)
      this.fetchProfile()
    }
    if (avatarFile) {
      let avatarThread
      const threads = await textile.threads.list()
      for (const thread of threads.items) {
        if (thread.key === AVATAR_KEY) {
          avatarThread = thread
          break
        }
      }
      if (!avatarThread) {
        const schemas = await textile.schemas.defaults()
        const avatarSchema = schemas.avatar
        const file = await textile.schemas.add(avatarSchema)
        avatarThread = await textile.threads.add(
            'Profile Images', file.hash, AVATAR_KEY, 'private', 'not_shared'
          )
      }
      const addedFile = await textile.files.add(avatarFile, 'avatar', avatarThread.id)
      await textile.profile.setAvatar(addedFile.files[0].links.large.hash)
      this.fetchProfile()
    }
  }
  @action async fetchStatus() {
    try {
      const online = await textile.utils.online()
      this.screen = online ? 'online' : 'error'
    } catch (err) {
      console.log(err)
    }
  }
  @action async addCafe(url: string, token: string) {
    try {
      await textile.cafes.add(url, token)
      this.fetchCafes()
    } catch (err) {
      console.log(err)
    }
  }
  @action async removeCafe(id: string) {
    try {
      const success = await textile.cafes.remove(id)
      if (success) {
        this.fetchCafes()
      } else {
        console.log('error!')
      }
    } catch (err) {
      console.log(err)
    }
  }
}

export interface Stores {
  store: AppStore
}

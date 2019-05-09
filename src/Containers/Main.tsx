import React from 'react'
import { ConnectedComponent, connect } from '../Components/ConnectedComponent'
import Notifications from '../Components/Notifications'
import { Image, Menu, Dropdown, Segment } from 'semantic-ui-react'
import { RouteComponentProps } from '@reach/router'
import { observer } from 'mobx-react'
import { Stores } from '../Stores'
const { shell } = window.require('electron')
import path from 'path'

@connect('store') @observer
export default class Summary extends ConnectedComponent<RouteComponentProps, Stores> {
  onAPIClick = () => { shell.openExternal('http://127.0.0.1:40600/docs/index.html') }
  onQuitClick = () => { this.stores.store.sendMessage({ name: 'quit' }) }
  onAccountClick = () => {
    if (this.props.navigate) {
      this.props.navigate('./profile')
    }
  }
  onConfigClick = () => {
    // tslint:disable-next-line:no-console
    console.log(this.stores.store.dataFolder)
    shell.showItemInFolder(path.join(this.stores.store.dataFolder, 'textile'))
  }
  onSyncClick = () => {
    this.stores.store.syncAccount()
    this.stores.store.fetchProfile()
  }
  render() {
    const { store } = this.stores
    return (
      <div>
        <Menu attached='top' borderless style={{ border: 'none' }}>
          <Menu.Item header as='h3' style={{ padding: '10px' }}>
            {store.profile && <Image avatar src={store.profile.avatar}/>}
            <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {store.profile && store.profile.name}
            </span>
          </Menu.Item>
          <Menu.Menu position='right'>
            <Dropdown item style={{ padding: 0, margin: 0, paddingLeft: '0.5em' }} icon={{size: 'large', name: 'setting'}}>
              <Dropdown.Menu>
                <Dropdown.Item icon='user' text='Account' onClick={this.onAccountClick} />
                <Dropdown.Item icon='wrench' text='Settings' disabled/>
                <Dropdown.Item icon='sync' text='Sync' />
                <Dropdown.Divider />
                <Dropdown.Item icon='wrench' text='Config File' onClick={this.onConfigClick} />
                <Dropdown.Item icon='external' text='API Docs' onClick={this.onAPIClick}/>
                <Dropdown.Divider />
                <Dropdown.Item icon='close' text='Quit' onClick={this.onQuitClick}/>
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Menu>
        </Menu>
        <Segment basic style={{ height: 'calc(100vh - 1.5em - 50px)', overflowY: 'auto', marginTop: 0, marginBottom: 0 }} >
          <Notifications />
        </Segment>
      </div>
    )
  }
}

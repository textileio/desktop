import React from 'react'
import { observer } from 'mobx-react'
import { Feed } from 'semantic-ui-react'
import { ConnectedComponent, connect } from './ConnectedComponent'
import Notification from './Notification'
import { Stores } from '../Stores'

@connect('store') @observer
export default class Notifications extends ConnectedComponent<{}, Stores> {
  state = {
    isLoading: false
  }
  render() {
    const { notifications } = this.stores.store
    return (
      <Feed size='small' style={{ overflowX: 'hidden' }}>
        {notifications && notifications.map((item: any) => <Notification key={item.id} item={item} />)}
      </Feed>
    )
  }
}

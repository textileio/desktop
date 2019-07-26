import React from 'react'
import { observer } from 'mobx-react'
import { Segment, Header, Card } from 'semantic-ui-react'
import { ConnectedComponent, connect } from '../Components/ConnectedComponent'
import { RouteComponentProps } from '@reach/router'
import BackArrow from '../Components/BackArrow'
import { Stores } from '../Stores'
import { Thread } from '@textile/js-http-client'
import Moment from 'react-moment'
const { clipboard } = window.require('electron')

@connect('store') @observer
export default class Threads extends ConnectedComponent<RouteComponentProps, Stores> {
  componentDidMount() {
    this.stores.store.fetchThreads()
  }
  render() {
    const { threads } = this.stores.store
    return (
      <div>
        <Segment basic>
          <Header as='h3'>
            Threads
          <Header.Subheader>
              View and edit Threads
            </Header.Subheader>
          </Header>
          <Card.Group style={{ height: '85vh', overflowY: 'auto' }}>
            {threads && threads.map((item: Thread) => this.renderItem(item))}
          </Card.Group>
        </Segment>
        <BackArrow onClick={() => {
          if (this.props.navigate) {
            this.props.navigate('..')
          }
        }} />
      </div>
    )
  }
  renderItem(item: Thread) {
    return (
      <Card key={item.id}>
        <Card.Content>
          <Card.Header
            title='Click to copy thread id'
            style={{ cursor: 'pointer' }}
            onClick={() => clipboard.write({ text: item.id })}
          >{item.name}</Card.Header>
          <Card.Meta>
            {item.type && item.type.toLowerCase().replace('_', ' ')}
            {item.sharing && ' and ' + item.sharing.toLowerCase().replace('_', ' ')}
          </Card.Meta>
          <Card.Description>
            {item.peer_count} Peers sharing {item.block_count} items
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          Updated <Moment fromNow>{item.head_block ? item.head_block.date : undefined}</Moment>
        </Card.Content>
      </Card>
    )
  }
}

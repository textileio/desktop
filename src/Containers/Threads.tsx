import React from 'react'
import { observer } from 'mobx-react'
import { Segment, Icon, Header, Card } from 'semantic-ui-react'
import { ConnectedComponent, connect } from '../Components/ConnectedComponent'
import { RouteComponentProps } from '@reach/router'
import BackArrow from '../Components/BackArrow'
import { Stores } from '../Stores'
import Moment from 'react-moment'

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
            {threads && threads.map((item: any) => this.renderItem(item))}
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
  renderItem(item: any) {
    return (
      <Card key={item.id}>
        <Card.Content>
          <Card.Header>{item.name}</Card.Header>
          <Card.Meta>
            {item.type && item.type.toLowerCase().replace('_', ' ')}
            {item.sharing && ' and ' + item.sharing.toLowerCase().replace('_', ' ')}
          </Card.Meta>
          <Card.Description>
            {item.peer_count} Peers sharing {item.block_count} items
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          Updated <Moment fromNow>{item.head_block.date}</Moment>
        </Card.Content>
      </Card>
    )
  }
}

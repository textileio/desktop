import React, { createRef, SyntheticEvent } from 'react'
import { observer } from 'mobx-react'
import { Segment, Label, Icon, Image, Input, Form, Header, Button } from 'semantic-ui-react'
import { ConnectedComponent, connect } from '../Components/ConnectedComponent'
import { RouteComponentProps } from '@reach/router'
import BackArrow from '../Components/BackArrow'
import { Stores } from '../Stores'
import Moment from 'react-moment'

const { clipboard, shell } = window.require('electron')

@connect('store') @observer
export default class Profile extends ConnectedComponent<RouteComponentProps, Stores> {
  state = {
    isLoading: false
  }
  private inputRef = createRef<HTMLInputElement>()
  private fileUploader = createRef<HTMLInputElement>()
  componentDidMount() {
    this.stores.store.fetchProfile()
  }
  handleDislpayName = (e: SyntheticEvent) => {
    e.preventDefault()
    const current = this.inputRef.current
    if (current) {
      this.stores.store.setProfile(current.value, undefined)
    }
  }
  handleAvatar = (e: SyntheticEvent) => {
    e.preventDefault()
    const files = (e.target as HTMLInputElement).files
    if (files && files.length > 0) {
      this.stores.store.setProfile(undefined, files[0])
    }
  }
  onAddressClick = () => {
    const { profile } = this.stores.store
    if (profile) {
      clipboard.write({ text: profile.address })
    }
  }
  onCafesClick = () => {
    this.stores.store.fetchCafes().then(() => {
      if (this.props.navigate) {
        this.props.navigate('./cafes')
      }
    })
  }
  onThreadsClick = () => {
    this.stores.store.fetchThreads().then(() => {
      if (this.props.navigate) {
        this.props.navigate('./threads')
      }
    })
  }

  onPagesClick = () => {
    this.stores.store.fetchCafes().then(() => {
      if (this.props.navigate) {
        this.props.navigate('./cafes')
      }
    })
  }

  onAppClick = (appIdentifier: string) => {
    // Simple now to allow register many appIdentfiers
    return () => {
      const pages = this.stores.store.apps[appIdentifier]
      const { link } = pages
      const url = link || 'https://gateway.textile.cafe/ipfs/QmbAcNHrge3qrxHghV915c7MnSf6sAJs3ARY7YaYf82k9J'
      shell.openExternal(url)
    }
  }
  render() {
    const { profile } = this.stores.store
    return (
      <div style={{ height: 'calc(100vh - 1em)' }}>
        <Segment basic style={{ height: 'calc(100vh - 1em)' }}>
          <Header
            title='Click to copy node address'
            as='h3'
            style={{ cursor: 'pointer' }}
            onClick={this.onAddressClick}
          >
            ACCOUNT
            <Header.Subheader>
              Updated {profile ? <Moment fromNow>{profile.date}</Moment> : 'never'}
            </Header.Subheader>
          </Header>
          <input
            type='file'
            id='file'
            ref={this.fileUploader}
            style={{ display: 'none' }}
            onChange={this.handleAvatar}
          />
            <Segment basic style={{ padding: 0 }}>
              {profile &&
                <Image
                  style={{ objectFit: 'cover', width: '90px', height: '90px' }}
                  centered
                  circular
                  src={profile.avatar} size='small'
                />
              }
            <Label as='a' style={{ padding: '1em 0 0 1em', border: 'none', left: '20%' }}
                basic attached='top left' size='large'
                onClick={() => {
                  if (this.fileUploader.current) {
                    this.fileUploader.current.click()
                  }
                }}
              >
                <Icon.Group style={{ margin: 0 }} size='large'>
                  <Icon name='image outline' />
                  <Icon corner='top right' name='pencil' />
                </Icon.Group>
              </Label>
            </Segment>
          <Header as='h4' style={{margin: '1em 0 0.2em 0'}}>Display name</Header>
          <Form onSubmit={this.handleDislpayName}>
            <Form.Field>
              <Input
                placeholder='name'
                iconPosition='left'
                defaultValue={profile ? profile.name : ''}
              >
                <Icon link onClick={this.handleDislpayName} name='save outline' />
                <input ref={this.inputRef} />
              </Input>
            </Form.Field>
          </Form>
          <Header as='h4' style={{margin: '1em 0 0.2em 0'}}>Account tools</Header>
          <Button.Group basic fluid compact>
            <Button content='Pages' icon='lab' type='button' onClick={this.onAppClick('pages.textile.io')}/>
            <Button content='Cafes' icon='coffee' type='button' onClick={this.onCafesClick} />
            <Button content='Threads' icon='users' type='button' onClick={this.onThreadsClick}/>
          </Button.Group>
        </Segment>
        <BackArrow onClick={() => {
          if (this.props.navigate) {
            this.props.navigate('..')
          }
        }} />
      </div>
    )
  }
}

import React, { SyntheticEvent, FormEvent, ChangeEvent } from 'react'
import {
  Button, Header, Segment, Form, TextAreaProps, Message, Icon, Popup, InputOnChangeData,
  Progress, Input, PopupProps
} from 'semantic-ui-react'
import zxcvbn from 'zxcvbn'
import { RouteComponentProps } from '@reach/router'
import BackArrow from '../Components/BackArrow'
import { ConnectedComponent, connect } from '../Components/ConnectedComponent'
import { observer } from 'mobx-react'
import { Stores } from '../Stores'

interface LoginState {
  mnemonic: string
  password: string
  score?: number
  passType: string // password | input
}

const BIP39Popup = (props: PopupProps) => {
  return (
    < Popup hoverable trigger = { props.trigger } >
      <Popup.Content>
        We use a <a href='https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki'>BIP39</a> mnemonic.
        It cannot be recovered, so don't forget it!
      </Popup.Content>
    </Popup >
  )
}

const PasswordPopup = (props: PopupProps) => {
  return (
    < Popup hoverable trigger={props.trigger} >
      <Popup.Content>
        This password will be used to <a href='https://github.com/mutecomm/go-sqlcipher'>encrypt</a> your local Textile database.
        It cannot be recovered, so don't forget it!
      </Popup.Content>
    </Popup >
  )
}

@connect('store') @observer
export default class Login extends ConnectedComponent<RouteComponentProps, Stores, LoginState> {
  state = {
    mnemonic: '',
    password: '',
    score: undefined,
    passType: 'password'
  }
  handlePassChange = (event: ChangeEvent, data: InputOnChangeData) => {
    if (data.name === 'password') {
      this.setState({ password: data.value as string, score: zxcvbn(data.value).score })
    }
  }
  handleMnemonicChange = (event: FormEvent, data: TextAreaProps) => {
    if (data.name === 'mnemonic') {
      this.setState({ mnemonic: data.value as string })
    }
  }
  handleSubmit = (event: SyntheticEvent) => {
    this.stores.store.screen = 'loading'
    this.stores.store.initAndStartTextile(this.state.mnemonic, undefined, this.state.password)
  }
  // tslint:disable-next-line:no-console
  handleError = () => console.log('error')
  togglePassType = () => this.setState({
    passType: this.state.passType === 'password' ? 'input' : 'password'
  })
  render() {
    const { mnemonic, password, passType, score } = this.state
    const inValid = mnemonic.split(/\b[^\s]+\b/).length < 13
    return (
      <div>
        <Form onSubmit={this.handleSubmit}>
          <Segment basic>
            <Header as='h3'>
              Enter an existing <BIP39Popup trigger={<span style={{ textDecoration: 'underline' }}>mnemonic passphrase</span>} />
            </Header>
            <Form.TextArea
              style={{ fontSize: '1.2em', padding: '0.2em' }}
              name='mnemonic'
              value={mnemonic}
              onChange={this.handleMnemonicChange}
            />
            <Message
              warning
              visible={inValid && mnemonic !== ''}
              header='Must be >12 words long'
              content={'Your mnemonic must be at least 12 words long.'}
            />
            <Form.Field>
              <label>Use an <PasswordPopup trigger={<span style={{ textDecoration: 'underline' }}>additional password</span>} /> for added security</label>
              <Input
                name='password'
                type={passType}
                placeholder='Password...'
                value={password}
                onChange={this.handlePassChange}
                icon={<Icon
                  name={passType === 'password' ? 'eye' : 'eye slash'}
                  link
                  onClick={this.togglePassType}
                />}
              />
              <Progress attached='bottom' indicating value={score || 0} total={4} />
            </Form.Field>
          </Segment>
        </Form>
        <Button.Group fluid widths='2' style={{ position: 'absolute', bottom: 0 }}>
          <Button onClick={this.handleSubmit} style={{ borderRadius: 0 }} content='Sign-in' icon='sign-in' type='button' disabled={inValid} />
        </Button.Group>
        <BackArrow onClick={() => {
          if (this.props.navigate) {
            this.props.navigate('..')
          }
        }} />
      </div>
    )
  }
}

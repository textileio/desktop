import React from 'react'
import { observer } from 'mobx-react'
import { Label } from 'semantic-ui-react'
import { Router, LocationProvider } from '@reach/router'
import Login from './Containers/Login'
import Profile from './Containers/Profile'
import Create from './Containers/Create'
import Landing from './Containers/Landing'
import Main from './Containers/Main'
import Cafes from './Containers/Cafes'
import Threads from './Containers/Threads'
import Basic from './Components/Basic'
import Splash from './Components/Splash'
import Start from './Containers/Start'
import { Stores } from './Stores'
import { ConnectedComponent, connect } from './Components/ConnectedComponent'

@connect('store') @observer
class App extends ConnectedComponent<{}, Stores> {
  render() {
    const { store } = this.stores
    return (
      <Label style={{ height: 'calc(100vh - 0.5em)', width: '100vw', padding: 0, marginTop: '0.5em', fontSize: '2em' }} basic pointing>
        <div style={{ fontSize: '1em' }}>
          <LocationProvider history={store.history}>
            <Router>
              <Splash default />
              <Landing path='/landing' />
              <Basic path='/onboard'>
                <Start path='/' />
                <Login path='/login' />
                <Create path='/create' />
              </Basic>
              <Basic path='/online'>
                <Main path='/' />
                <Basic path='/profile'>
                  <Profile path='/' />
                  <Cafes path='/cafes' />
                  <Threads path='/threads' />
                </Basic>
              </Basic>
            </Router >
          </LocationProvider>
        </div>
      </Label>
    )
  }
}

export default App


import { createApp } from 'vue'

import './app.scss'
import { useFunction } from './api/useFunction'

const App = createApp({
  onShow(options) {
    console.log('App onShow.')
  },
  onLaunch() {
    const { init } = useFunction()
    init()
  },
})

export default App

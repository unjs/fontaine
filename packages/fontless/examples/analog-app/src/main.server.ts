import { render } from '@analogjs/router/server'
import { AppComponent } from './app/app.component'
import { config } from './app/app.config.server'

import 'zone.js/node'
import '@angular/platform-server/init'

export default render(AppComponent, config)

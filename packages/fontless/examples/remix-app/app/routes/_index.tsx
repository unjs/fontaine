import type { MetaFunction } from 'react-router'

import './styles/styles.css'

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ]
}

export default function Index() {
  return (
    <div>
      <h1>Google</h1>
      <p className="google-poppins">Poppins</p>
      <p className="google-press-start">Press Start 2P</p>

      <h1>Bunny</h1>
      <p className="bunny-aclonica">Aclonica</p>
      <p className="bunny-allan">Allan</p>

      <h1>FontShare</h1>
      <p className="font-share-panchang">Panchang</p>

      <h1>FontSource</h1>
      <p className="font-source-luckiest">Luckiest</p>

      <h1>Local</h1>
      <p className="local">Local font</p>
    </div>
  )
}

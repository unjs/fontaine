import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

const cacheBase = 'node_modules/.cache/fontless/meta'

export const storage = createStorage({
  driver: fsDriver({ base: cacheBase }),
})

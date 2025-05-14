import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

export const cacheBase = 'node_modules/.cache/fontless/meta'

export const storage = createStorage({
  driver: fsDriver({ base: cacheBase }),
})

import type { Storage, StorageValue } from 'unstorage'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

const cacheBase = 'node_modules/.cache/fontless/meta'

export const storage: Storage<StorageValue> = createStorage({
  driver: fsDriver({ base: cacheBase }),
})

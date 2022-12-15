require('dotenv').config()
const fs = require('fs/promises')
const chokidar = require('chokidar')
const logger = require('pino')()
const parse = require('./parse')
const { Queue } = require('./queue')

const dir = process.env.dir

logger.info('Started!')

const queue = Queue.channels(2)
  .process(processFile)
  .validate(isUnlocked)
  .success((res) => {
    logger.info(res.length)
  })
  .failure(async (err, filepath) => {
    try {
      logger.error(err)
      await fs.copyFile(filepath, './failed')
    } catch (err) {
      logger.error(err, 'onFailure error')
    }
  })
  .done(async (filepath) => {
    try {
      await fs.unlink(filepath)
      logger.debug(filepath, 'deleted!')
    } catch (err) {
      logger.error(err, 'onDone error')
    }
  })


chokidar.watch(dir, { depth: 0, awaitWriteFinish: true, ignorePermissionErrors: true})
  .on('add', async (filepath) => {
    logger.info(filepath)
    queue.add(filepath)
  })

async function processFile (filepath) {
  const res = await parse(filepath)
  return res
}

async function isUnlocked (filepath) {
  try {
    const fd = await fs.open(filepath, fs.constants.O_RDONLY | 0x10000000)
    await fd.close()
    logger.debug('access allowed', filepath)
    return true
  } catch (err) {
    logger.error(err, 'isLocked err')
    return false
  }
}
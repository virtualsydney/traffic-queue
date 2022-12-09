const fs = require('fs/promises')
const path = require('path')
const chokidar = require('chokidar')
const logger = require('pino')()
const parse = require('./parse')

logger.info('Started!')

const dir = 'C:\\Users\\Artem\\source\\repos\\resourcelock\\dumps'

chokidar.watch(dir, { depth: 0, awaitWriteFinish: true, ignorePermissionErrors: true})
  .on('add', async (filepath) => {
    logger.info(filepath)
    const locked = await isLocked(filepath)
    if (!locked) {
      await processFile (filepath)
    } else {
      logger.error('locked!')
    }
  })

async function processFile (filepath) {
  try {
    const res = await parse(filepath)
    console.log(res.length)
  } catch (err) {
    logger.error(err)
    await fs.copyFile(filepath, './failed')
  } finally {
    fs.unlink(filepath)
    logger.info(filepath, 'deleted!')
  }
}

async function isLocked (filepath) {
  try {
    const fd = await fs.open(filepath, fs.constants.O_RDONLY | 0x10000000)
    await fd.close()
    console.log('access allowed', filepath)
    return false
  } catch (err) {
    logger.error(err, 'isLocked err')
    return true
  }
}
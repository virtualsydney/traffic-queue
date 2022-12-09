const { spawn } = require("child_process")

async function parse(filepath) {
  return new Promise((resolve, reject) => {
    console.log('Tshark process file', filepath)
    const tshark = spawn(
      'tshark',
      [
        '-r', filepath,
        '-T', 'json'
      ],
      { cwd: 'C:/Program Files/Wireshark' }
    )

    let raw = ''

    tshark.stdout.on('data', (data) => {
      raw += data.toString()
    })
    tshark.stderr.on('err', (err) => {
      console.error(err, 'tshark stderr')
    })
    tshark.on('close', (code) => {
      console.log(`Tshark exit with code ${code}`)
      try {
        const result = JSON.parse(raw)
        resolve(result)
      } catch (err) {
        console.error('tshark fail')
        console.error(err)
      }
    })
  })
}
module.exports = parse

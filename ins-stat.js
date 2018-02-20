// Load the SDK
const AWS = require('aws-sdk')
const Stream = require('stream')
const Speaker = require('speaker')

var five = require('johnny-five'),
  board, button

var Raspi = require('raspi-io')
var board = new five.Board({
  io: new Raspi()
})

// Create an Polly client
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'ap-southeast-2'
})

// Create the Speaker instance
let Player = new Speaker({
  channels: 1,
  bitDepth:16,
  sampleRate: 16000
})

var AudioStream = new Stream.Readable()
AudioStream._read = function () {}
AudioStream.pipe(Player)

var Device = require('losant-mqtt').Device

// Construct device.
var device = new Device({
  id: '5a864147d9a36600075f9f3d',
  key: 'c3834ff6-9da7-422f-bb46-73981a5bd76f',
  secret: 'd6509aed338a3bb5fb4d18527fc0ea70f63cd29541f991991d231d05df91a177'
})

// Connect to Losant.
device.connect()

// Listen for commands.
device.on('command', function(command) {
  console.log('Command received yo.')
  console.log(command.name)
  console.log(command.payload)

  
    let params = {
      'Text': command.payload.text,
      'OutputFormat': 'pcm',
      'VoiceId': command.payload.voiceId
  }

  Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
          console.log('raar ' + err.code)
      } else if (data) {
          if (data.AudioStream instanceof Buffer) {
              AudioStream.push(data.AudioStream)
          }
      }
  })
  
  //speak(command.payload.text, command.payload.voiceId ? command.payload.voiceId : null )
})

board.on('ready', function() {

  // Create a new `button` hardware instance.
  // This example allows the button module to
  // create a completely default instance
  button = new five.Button({
   pin: 'GPIO4',
   isPullup: true
  })

  // Inject the `button` hardware into
  // the Repl instance's context
  // allows direct command line access
  board.repl.inject({
    button: button
  })

  // 'down' the button is pressed
  button.on('down', function() {
    console.log('down')
    device.sendState({ button: true })
  })

})

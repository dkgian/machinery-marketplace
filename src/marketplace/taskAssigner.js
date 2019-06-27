#!/usr/bin/env node
const socket = require('socket.io-client')('http://localhost:8000')
const uuid = require('uuid/v4')
const MachineInfo = require('../constant/MachineInfo')

const task = MachineInfo.MachineInfo.MACHINE_OPERATORS
const taskList = {
  tasks: [
    {
      taskId: uuid(),
      name: task[Math.floor(Math.random() * (task.length - 1))],
      requirements: [
        {
          name: 'test 1',
          detail: 'detail 1',
        },
        {
          name: 'test 2',
          detail: 'detail 2',
        },
      ],
      status: 'pending',
    },
  ],
}

socket.on('connect', () => {
  console.log('connected...')

  console.log('Sending task list...')
  socket.emit('tasks', JSON.stringify(taskList))
  console.log(taskList)

  // if (process.argv[2] && process.argv[3]) {
  //   console.log(`sending [${process.argv[2]}]: ${process.argv[3]}`)
  //
  //   socket.emit(process.argv[2], process.argv[3])
  //
  //   setTimeout(() => {
  //     process.exit(0)
  //   }, someDelay)
  // } else {
  //   console.log('usage: ./machine.js <event> <data>')
  //   process.exit(1)
  // }

  // rl.question('Resend task list?', (answer) => {
  //   if (answer === 'y') socket.emit('tasks', JSON.stringify(taskList))
  //   else process.exit(1)
  // })
})

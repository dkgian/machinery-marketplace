const socketIoClient = require('socket.io-client')
const MachineInfo = require('../constant/MachineInfo')

const io = socketIoClient.connect('http://localhost:8000')

const machineProfile = {
  id: undefined,
  type: 'machine',
  accountBalance: 0,
  canDo: ['task 1', 'task 2'],
  // status: MachineInfo.MachineInfo.STATUS_AVAILABLE, // available, unavailable, busy
}

function updateProfileOnServer() {
  io.emit('machine_profile_update', JSON.stringify(machineProfile))
}

function calculatePrice(taskObj) {
  if (taskObj.name === 'grinding') {
    return (Math.random() * 10).toFixed(2)
  }
  if (taskObj.name === 'coating') {
    return (Math.random() * 10).toFixed(2)
  }
  return undefined
}

function processingTask() {
  console.log('processing task...')
  return setTimeout(() => {
    console.log('task done!')
    console.log('=======================')
  }, 3000)
}

function returnWorkpieceAndGetPaid(taskObj) {
  io.emit('finished_workpiece', JSON.stringify(taskObj))
}

io.on('connect', () => {
  machineProfile.id = io.id
  updateProfileOnServer()
  console.log('MACHINE PROFILE: \n', machineProfile)
  console.log('====================================')

  io.on('bid', (task) => {
    const taskObj = JSON.parse(task)
    const bidPrice = calculatePrice(taskObj)
    const bidData = {
      taskId: taskObj.taskId,
      bidPrice,
    }

    setTimeout(() => {
      io.emit('bid_price', JSON.stringify(bidData))
    }, 4000)

    taskObj.bidPrice = bidPrice
    console.log(taskObj)
  })

  io.on('bid_session_result', async (winner) => {
    const winnerObj = JSON.parse(winner)

    if (winnerObj !== null) {
      const amIWinner = (winnerObj.machineId === io.id)

      console.log('BID SESSION RESULT: ', winnerObj)

      if (amIWinner) {
        processingTask()
        returnWorkpieceAndGetPaid(winnerObj)
      } else {
        console.log('MACHINE ACCOUNT BALANCE: ', parseFloat(machineProfile.accountBalance))
        console.log('Bidding session closed!')
        console.log('=======================')
      }
    }
  })

  io.on('payment', (message) => {
    const paymentObj = JSON.parse(message)
    machineProfile.accountBalance = (parseFloat(machineProfile.accountBalance)
      + parseFloat(paymentObj.amount)).toFixed(5)
    console.log('MACHINE ACCOUNT BALANCE: ', parseFloat(machineProfile.accountBalance))
    updateProfileOnServer()
  })
})

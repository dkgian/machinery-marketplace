const socketIoClient = require('socket.io-client')

const io = socketIoClient.connect('http://localhost:8000')

let accountBalance = 0

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
  console.log('MACHINE ID: ', io.id)
  console.log('MACHINE ACCOUNT BALANCE: ', accountBalance)
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
        console.log('MACHINE ACCOUNT BALANCE: ', parseFloat(accountBalance))
        console.log('Bidding session closed!')
        console.log('=======================')
      }
    }
  })

  io.on('payment', (message) => {
    const paymentObj = JSON.parse(message)
    accountBalance = (parseFloat(accountBalance) + parseFloat(paymentObj.amount)).toFixed(5)
    console.log('MACHINE ACCOUNT BALANCE: ', parseFloat(accountBalance))
  })
})

const socketIO = require('socket.io')
const _ = require('lodash')

// const constant = require('../constant')

const io = socketIO.listen(8000)
const clientsList = []
const bidObjects = []

function removeClientFromList(id) {
  const disconnectedClientIndex = clientsList.indexOf(id)

  if (disconnectedClientIndex !== -1) {
    clientsList.splice(disconnectedClientIndex, 1)
  }
}

function addClientToList(id) {
  const alreadyExists = (clientsList.indexOf(id)) !== -1

  if (!alreadyExists) {
    clientsList.push(id)
  }
}

function showClientsList() {
  console.log('Client list: ', clientsList)
}

function updateBidPriceList(bidObject) {
  bidObjects.push(bidObject)
  if (bidObjects.length === clientsList.length - 1) {
    console.log('Bidding list: ', bidObjects)
    console.log('--------------------------')
  }
}

function chooseBidSessionWinner(bidList) {
  if (bidObjects.length === clientsList.length - 1) {
    return _.minBy(bidList, 'bidPrice')
  }
  return undefined
}

function payForTask(task) {
  setTimeout(() => {
    console.log(`Sent ${task.bidPrice} € to MachineId ${task.machineId}`)
  }, 60000)
  const paymentData = {
    amount: task.bidPrice,
  }
  io.to(task.machineId).emit('payment', JSON.stringify(paymentData))
}

// event fired every time a new machine connects:
io.on('connection', (socket) => {
  // =============================================================
  // add machine to list
  addClientToList(socket.id)
  showClientsList()

  // remove machine from list
  socket.on('disconnect', () => {
    removeClientFromList(socket.id)
    showClientsList()
  })

  // get msg from machine
  socket.on('message', (message) => {
    console.log(`From ${_.truncate(socket.id, { length: 8 })} : ${message}`)
  })

  socket.on('bid_price', (bidData) => {
    const bidDataObject = JSON.parse(bidData)

    // console.log(`MachineId ${_.truncate(socket.id, { length: 8 })} places ${bidDataObject.bidPrice} € for TaskID ${bidDataObject.taskId}`)

    bidDataObject.machineId = socket.id
    updateBidPriceList(bidDataObject)

    const winner = chooseBidSessionWinner(bidObjects)
    if (winner !== undefined) {
      console.log('WINNER : ', winner)
      console.log('------------------------')
    }


    io.emit('bid_session_result', JSON.stringify(winner))

  })

  socket.on('finished_workpiece', (task) => {
    const taskObj = JSON.parse(task)
    console.log('Task done: ', taskObj)
    console.log('------------------------')

    payForTask(taskObj)
  })

  // =============================================================
  // Get task list msg for preparing to open bid session
  socket.on('tasks', (message) => {
    const transaction = JSON.parse(message)

    transaction.tasks.map((task) => {
      // console.log(task)
      const StringifiedTask = JSON.stringify(task)
      io.emit('bid', StringifiedTask)

      return 1
    })
  })
  // =============================================================
})

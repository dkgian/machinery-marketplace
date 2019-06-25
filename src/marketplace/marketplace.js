const http = require('http')
const app = require('express')()
const socketIO = require('socket.io')
const _ = require('lodash')

const server = http.createServer(app)
server.listen(8000)
const io = socketIO(server)

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
    console.log('***** FINISH SESSION *****')
  }, 6000)
  const paymentData = {
    amount: task.bidPrice,
  }
  io.to(task.machineId).emit('payment', JSON.stringify(paymentData))
}

function getClientListAndEmit(socket) {
  socket.emit('client_list', clientsList)
}

// event fired every time a new machine connects:
io.on('connection', (socket) => {
  // =============================================================
  // add machine to list
  addClientToList(socket.id)
  showClientsList()
  setInterval(() => getClientListAndEmit(socket), 1000)

  // remove machine from list
  socket.on('disconnect', () => {
    removeClientFromList(socket.id)
  })

  // get msg from machine
  socket.on('message', (message) => {
    console.log(`From ${_.truncate(socket.id, { length: 8 })} : ${message}`)
  })

  socket.on('bid_price', (bidData) => {
    const bidDataObject = JSON.parse(bidData)

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
    _.remove(bidObjects)
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

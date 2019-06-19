export class Machine {
  id: string
  balance: number

  constructor(id: string, balance: number, ) {
    this.id = id
    this.balance = balance
  }

  getId(): string {
    return this.id
  }

  getBalance(): number {
    return this.balance
  }

  setBalance(amount: number) {
    this.balance = this.balance + amount
  }
}

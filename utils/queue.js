class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    return this.isEmpty() ? null : this.items.shift();
  }

  head() {
    return this.isEmpty() ? null : this.items[0];
  }

  isEmpty() {
    return this.items.length == 0;
  }
}

module.exports = new Queue();

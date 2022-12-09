'use strict'

class Queue {
  constructor(concurrency) {
    this.concurrency = concurrency
    this.count = 0
    this.waiting = []
    this.onProcess = null;
    this.onSuccess = null
    this.onFailure = null
    this.onDone = null
    this.onValidate = null
  }

  static channels(concurrency) {
    return new Queue(concurrency)
  }

  async add(task) {
    const hasChannel = this.count < this.concurrency
    this.waiting.push(task);
    if (hasChannel) {
      await this.next();
      return;
    }
  }

  async next() {
    const filepath = this.waiting.shift()
    this.count++;
    try {
      const isValid = await this.onValidate(filepath)
      if (isValid) {
        const result = await this.onProcess(filepath)
        this.onSuccess(result);
        await this.onDone(filepath)
        if (this.waiting.length > 0) {
          const nextTask = this.waiting[0];
          await this.next(nextTask);
          return;
        }
      } else {
        this.waiting.push(filepath)
      }
    } catch (err) {
      await this.onFailure(err, filepath);
      await this.onDone(filepath)
    } finally {
      this.count--;
    }
  }

  process(listener) {
    this.onProcess = listener;
    return this;
  }

  success(listener) {
    this.onSuccess = listener;
    return this;
  }

  failure(listener) {
    this.onFailure = listener;
    return this;
  }

  done(listener) {
    this.onDone = listener;
    return this;
  }

  validate(listener) {
    this.onValidate = listener;
    return this;
  }
}

module.exports = { Queue }

// Usage

// const job = (task, next) => {
//   console.log(`Process: ${task.name}`);
//   setTimeout(next, task.interval, null, task);
// };

// const queue = Queue.channels(3)
//   .process(job)
//   .success((res) => console.log(`Success: ${res.name}`))
//   .failure((err) => console.log(`Failure: ${err}`))
// for (let i = 0; i < 10; i++) {
//   queue.add({ name: `Task${i}`, interval: i * 1000 });
// }

// module.exports.Queue = Queue
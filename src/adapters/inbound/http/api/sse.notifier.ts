import { Response } from 'express'

export class SseNotifier {
  private readonly subscribers = new Map<string, Set<Response>>()

  subscribe(filename: string, res: Response): void {
    let clients = this.subscribers.get(filename)
    if (clients === undefined) {
      clients = new Set()
      this.subscribers.set(filename, clients)
    }
    clients.add(res)
  }

  unsubscribe(filename: string, res: Response): void {
    const clients = this.subscribers.get(filename)
    if (clients === undefined) return
    clients.delete(res)
    if (clients.size === 0) this.subscribers.delete(filename)
  }

  notify(filename: string): void {
    const clients = this.subscribers.get(filename)
    if (clients === undefined) return
    for (const res of clients) {
      res.write('data: updated\n\n')
    }
  }
}

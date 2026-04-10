export class WsService {
  private connections: Map<number, Set<any>> = new Map()

  register(userId: number, ws: any) {
    if (!userId) return
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(ws)

    ws.on('close', () => this.unregister(userId, ws))
    ws.on('error', () => this.unregister(userId, ws))
  }

  unregister(userId: number, ws: any) {
    const set = this.connections.get(userId)
    if (set) {
      set.delete(ws)
      if (set.size === 0) this.connections.delete(userId)
    }
  }

  broadcastToUser(userId: number, data: any) {
    const set = this.connections.get(userId)
    if (!set) return
    const msg = JSON.stringify(data)
    set.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(msg)
      }
    })
  }
}

export const wsService = new WsService()

import { WebSocketServer, WebSocket } from 'ws';

class EarningsWebSocketService {
  private wss: WebSocketServer | undefined;
  private clients: Set<WebSocket>;
  private gains: { player: string; amount: number }[]; // Lista de ganhos

  constructor() {
    this.clients = new Set();
    this.gains = []; // Inicializando com uma lista vazia de ganhos
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(server: any): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (socket: WebSocket) => {
      this.clients.add(socket);
      console.log('Client connected. Total clients:', this.clients.size);

      // Envia os dados atuais de ganhos para o cliente logo após a conexão
      this.sendCurrentGains(socket);

      socket.on('close', () => {
        this.clients.delete(socket);
        console.log('Client disconnected. Total clients:', this.clients.size);
      });

      socket.on('message', (message: string) => {
        console.log('Received message from client:', message);
        // Aqui você pode processar os dados recebidos do cliente, se necessário
      });
    });
  }

  // Envia os dados atuais de ganhos para o cliente
  private sendCurrentGains(socket: WebSocket): void {
    const data = { type: 'current-gains', data: this.gains };
    socket.send(JSON.stringify(data));
    console.log('Sent current gains to client:', this.gains);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcast(data: any): void {
    const message = JSON.stringify(data);
    console.log('Broadcasting data to clients:', data);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        console.log('Sent data to client:', message);
      }
    }
  }

  // Função para adicionar ganhos à lista
  public addGain(player: string, amount: number): void {
    const newGain = { player, amount };
    this.gains.unshift(newGain);

    // Mantém os últimos 10 ganhos
    if (this.gains.length > 10) {
      this.gains.pop();
    }

    // Envia a atualização para os clientes conectados
    this.broadcast({ type: 'update-gains', data: this.gains });
  }
}

export default new EarningsWebSocketService();

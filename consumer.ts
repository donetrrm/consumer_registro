import amqp from 'amqplib';
import dotenv from 'dotenv';
import { io } from 'socket.io-client';

dotenv.config();

async function consumeMessages() {
  const options = {
    vhost: process.env.AMQP_VHOST,
    username: process.env.AMQP_USERNAME,
    password: process.env.AMQP_PASSWORD,
    port: process.env.AMQP_PORT,
  };

  const url = process.env.AMQP_URL || "";
  const queue = process.env.AMQP_QUEUE || "";
  const persons = "persons";
  const connection = await amqp.connect(url, options);
  const channel = await connection.createChannel();
  const channelIP = await connection.createChannel();

  await channelIP.assertQueue(persons, { durable: true });
  await channel.assertQueue(queue, { durable: true });

  console.log(`Escuchando mensajes en la cola ${persons}`);

  channelIP.consume(persons, async (msg) => {
    if (msg !== null) {
      try {
        const msjJSON = JSON.parse(msg.content.toString());
        console.log(msjJSON);
        await enviarWebsocket();  // Enviar mensaje al WebSocket
        channelIP.ack(msg);
      } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        channelIP.reject(msg, false);
      }
    }
  });
}

async function enviarWebsocket() {
  const websocketUrl = process.env.WEBSOCKET_URL || 'http://localhost:5000';
  const socket = io(websocketUrl);

  socket.on('connect', () => {
    console.log('Conectado al WebSocket');
    socket.emit('personasDentro', 12345);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del WebSocket');
  });

  socket.on('connect_error', (err) => {
    console.error('Error de conexión al WebSocket:', err);
  });
}

consumeMessages().catch(console.error);

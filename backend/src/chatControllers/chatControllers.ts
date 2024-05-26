import { Server as SocketIOServer, Socket } from 'socket.io';
import { saveMessage, fetchGroupMessages, getUserById } from './chatFunctions';

export default function initializeSocketIO(server: any) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:8081", // Match this to the frontend URL
      methods: ["GET", "POST"], // Adjust according to the methods you need
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    socket.on('joinGroup', async (groupId: number, userId: number) => {
      socket.join(groupId.toString());
      console.log(`User ${userId} joined group ${groupId}`);

      // Optionally, send chat history to the user
      const messages = await fetchGroupMessages(groupId);
      socket.emit('chatHistory', messages);
    });

    socket.on('sendMessage', async (message: string, groupId: number, userId: number) => {
      try {
        const savedMessage = await saveMessage(groupId, userId, message); // Save message to database
        
        const user = await getUserById(userId);
        const username = user ? user.username : "Unknown User";
    
        const messageWithUsername = { ...savedMessage, username };
        
        io.to(groupId.toString()).emit('receiveMessage', messageWithUsername);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

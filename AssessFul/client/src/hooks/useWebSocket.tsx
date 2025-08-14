import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  projectId?: string;
  [key: string]: any;
}

export function useWebSocket(projectId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Join project room if projectId is provided
      if (projectId) {
        ws.current?.send(JSON.stringify({ type: 'join_project', projectId }));
      }
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          connect();
        }
      }, 3000);
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to real-time updates",
        variant: "destructive",
      });
    };
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const onMessage = (callback: (message: WebSocketMessage) => void) => {
    if (ws.current) {
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          callback(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [projectId]);

  return {
    isConnected,
    sendMessage,
    onMessage,
  };
}

export interface IncomingMessage {
  sender: string;
  // TODO: more concrete message types
  message: {
    type: string;
    content: any;
  };
}

export interface OutgoingMessage {
  recipient: string;
  type: string;
  content: any;
}

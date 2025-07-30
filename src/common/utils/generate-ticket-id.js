import { nanoid } from 'nanoid'

export const generateTicketId = () => {
    const prefix = 'SUP'; 
    const id = nanoid(8).toUpperCase(); // e.g. 'A1B2C3D4'
    return `${prefix}-${id}`;
  };
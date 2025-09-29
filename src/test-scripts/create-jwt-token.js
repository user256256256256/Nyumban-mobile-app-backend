import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: '4d4fa30b-02c0-4cfe-b161-672dd9d6847a', role: 'admin' },
  'my_ultra_secret_jwt_key',
  { expiresIn: '30d' }
);

console.log(token);


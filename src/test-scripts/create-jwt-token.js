import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: '0ae678c8-09e4-4c75-b495-665bf6dde7e2', role: 'landlord' },
  'my_ultra_secret_jwt_key',
  { expiresIn: '30d' }
);

console.log(token);


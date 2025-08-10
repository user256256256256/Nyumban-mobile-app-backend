import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: '56140da1-9010-4466-a9b2-8b80d0bff87b', role: 'landlord' },
  'my_ultra_secret_jwt_key',
  { expiresIn: '30d' }
);

console.log(token);


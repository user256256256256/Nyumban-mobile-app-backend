import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: '560045ec-86a8-45fa-ba1d-661341fe77d1', role: 'admin' },
  'my_ultra_secret_jwt_key',
  { expiresIn: '30d' }
);

console.log(token);

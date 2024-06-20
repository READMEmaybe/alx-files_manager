import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth) return res.status(401).send({ error: 'Unauthorized' });
    const base64Credentials = auth.split(' ')[1];
    if (!base64Credentials) return res.status(401).send({ error: 'Unauthorized' });
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });
    const user = await (await dbClient.usersCollection('users')).findOne({ email, password: sha1(password) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;

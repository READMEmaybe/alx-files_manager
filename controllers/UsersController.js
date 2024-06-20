import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const user = await (await dbClient.usersCollection('users')).findOne({ email });
    if (user) return res.status(400).send({ error: 'Already exist' });
    const result = await (await dbClient.usersCollection('users')).insertOne({ email, password: sha1(password) });
    return res.status(201).send({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    console.log(userId);
    const user = await (await dbClient.usersCollection('users')).findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

export default UsersController;

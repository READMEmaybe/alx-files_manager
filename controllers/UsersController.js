import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;

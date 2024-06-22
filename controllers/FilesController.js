import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    const name = req.body.name || null;
    const type = req.body.type || null;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const data = req.body.data || null;
    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type || !['file', 'folder', 'image'].includes(type)) return res.status(400).send({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });
    if (parentId) {
      const parent = await (await dbClient.filesCollection('files')).findOne({
        _id: ObjectId(parentId),
      });
      if (!parent) return res.status(400).send({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
    }
    const user = await (await dbClient.usersCollection('users')).findOne({
      _id: ObjectId(userId),
    });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      parentId,
      isPublic,
    };

    if (type !== 'folder') {
      const filename = uuidv4();
      const filedata = Buffer.from(data, 'base64');
      const filepath = `${FOLDER_PATH}/${filename}`;
      query.localPath = filepath;
      try {
        await fs.promises.mkdir(FOLDER_PATH, { recursive: true });
        await fs.promises.writeFile(filepath, filedata);
      } catch (error) {
        return res.status(400).send({ error: 'Cannot write file' });
      }
    }
    const result = await (await dbClient.filesCollection()).insertOne(query);

    return res.status(201).send({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const file = await (await dbClient.filesCollection('files')).findOne({
      _id: ObjectId(fileId),
    });
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const parentId = req.query.parentId || 0;
    const files = await (await dbClient.filesCollection('files')).find({
      userId: ObjectId(userId),
      parentId: parentId ? ObjectId(parentId) : 0,
    }).toArray();
    return res.status(200).send(files);
  }
}

export default FilesController;

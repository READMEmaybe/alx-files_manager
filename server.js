import express from 'express';
import router from './routes';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 5000;
const app = express();
app.use(bodyParser.json());
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

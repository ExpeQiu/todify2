import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import workflowRoutes from './routes/workflow';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/v1/workflows', workflowRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Todify2 Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
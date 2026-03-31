import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser());

router.get('/api/hello', (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Koa server running on http://localhost:${PORT}`);
});
